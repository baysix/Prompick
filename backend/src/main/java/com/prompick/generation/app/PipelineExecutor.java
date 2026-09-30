package com.prompick.generation.app;

import com.prompick.ai.domain.AiModel;
import com.prompick.ai.domain.AiModelRepository;
import com.prompick.ai.provider.GenerationProvider;
import com.prompick.config.PrompickProperties;
import com.prompick.generation.domain.*;
import com.prompick.generation.domain.JobStepRepository;
import com.prompick.generation.domain.OutputRepository;
import com.prompick.generation.domain.UploadRepository;
import com.prompick.storage.StorageService;
import com.prompick.template.domain.ContentType;
import com.prompick.template.domain.TemplatePipeline;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * 파이프라인을 단계별로 실행한다.
 *
 * <p>각 단계는 제출하고 → 끝날 때까지 확인하고 → 결과를 우리 스토리지로 옮긴다.
 * 앞 단계의 결과를 다음 단계 입력으로 넘기는 것도 여기서 한다.
 *
 * <p>프롬프트 원문은 로그에 남기지 않는다. 로그는 운영자 말고도 볼 수 있는 곳으로 흘러가기 쉽다.
 */
@Component
public class PipelineExecutor {

    private static final Logger log = LoggerFactory.getLogger(PipelineExecutor.class);

    /** {{변수}} 자리를 입력값으로 바꾼다 */
    private static final Pattern VARIABLE = Pattern.compile("\\{\\{\\s*([a-zA-Z0-9_]+)\\s*}}");

    /** 앞 단계 결과를 가리키는 표현 (예: steps[0].output) */
    private static final Pattern STEP_REFERENCE = Pattern.compile("steps\\[(\\d+)]\\.output");

    /** 한 단계가 끝나기를 기다리는 최대 시간 */
    private static final Duration STEP_TIMEOUT = Duration.ofMinutes(5);

    private final Map<com.prompick.ai.domain.Provider, GenerationProvider> providers;
    private final AiModelRepository models;
    private final JobStepRepository steps;
    private final OutputRepository outputs;
    private final UploadRepository uploads;
    private final com.prompick.template.domain.TemplateRepository templates;
    private final StorageService storage;
    private final PrompickProperties properties;

    public PipelineExecutor(
            List<GenerationProvider> providerList,
            AiModelRepository models,
            JobStepRepository steps,
            OutputRepository outputs,
            UploadRepository uploads,
            com.prompick.template.domain.TemplateRepository templates,
            StorageService storage,
            PrompickProperties properties) {
        this.providers = new HashMap<>();
        providerList.forEach(p -> this.providers.put(p.type(), p));
        this.models = models;
        this.steps = steps;
        this.outputs = outputs;
        this.uploads = uploads;
        this.templates = templates;
        this.storage = storage;
        this.properties = properties;
        log.info("사용 가능한 AI 제공사: {}", this.providers.keySet());
    }

    /**
     * 작업 하나를 끝까지 실행한다.
     *
     * @param onStepStart 단계를 시작할 때마다 불린다. 화면의 진행률이 이 값으로 움직인다.
     * @return 만들어진 결과물
     * @throws StepFailedException 한 단계라도 실패하면
     */
    public GenerationOutput execute(
            GenerationJob job,
            TemplatePipeline pipeline,
            ContentType outputType,
            java.util.function.IntConsumer onStepStart) {

        // 단계 사이에 주고받는 파일들. 키는 steps[n].output 형태
        Map<String, String> stepOutputs = new HashMap<>();
        Map<String, Object> variables = resolveVariables(job);

        String lastKey = null;
        String lastContentType = null;

        List<Map<String, Object>> stepDefs = pipeline.getSteps();
        for (int i = 0; i < stepDefs.size(); i++) {
            Map<String, Object> def = stepDefs.get(i);
            GenerationJobStep record = stepRecordFor(job.getId(), i);
            onStepStart.accept(i);

            try {
                StepResult result = runStep(def, variables, stepOutputs, job);
                stepOutputs.put("steps[%d].output".formatted(i), result.storageKey());
                lastKey = result.storageKey();
                lastContentType = result.contentType();
                record.succeed(result.storageKey());

            } catch (RuntimeException e) {
                // 원인 원문은 관리자용 기록에만 남긴다.
                record.fail(e.getMessage());
                steps.save(record);
                throw new StepFailedException(i, e);
            }
            steps.save(record);
        }

        if (lastKey == null) {
            throw new StepFailedException(0, new IllegalStateException("단계가 하나도 없습니다"));
        }

        // 마지막 단계 결과가 사용자에게 줄 결과물이다.
        boolean watermark = job.getChargeType() == ChargeType.FREE && properties.free().watermark();
        Instant expiresAt = Instant.now().plus(Duration.ofDays(properties.output().retentionDays()));

        return outputs.save(new GenerationOutput(
                job.getId(),
                mediaTypeOf(lastContentType, outputType),
                lastKey,
                watermark,
                expiresAt));
    }

    /** 이 단계의 기록을 가져온다. 재시도라면 기존 기록을 다시 쓴다. */
    private GenerationJobStep stepRecordFor(Long jobId, int stepIndex) {
        return steps.findByJobIdAndStepIndex(jobId, stepIndex)
                .map(existing -> {
                    existing.restart();
                    return steps.save(existing);
                })
                .orElseGet(() -> steps.save(new GenerationJobStep(jobId, stepIndex)));
    }

    private StepResult runStep(
            Map<String, Object> def,
            Map<String, Object> variables,
            Map<String, String> stepOutputs,
            GenerationJob job) {

        Long modelId = asLong(def.get("modelId"));
        AiModel model = modelId == null
                ? null
                : models.findById(modelId).orElse(null);

        if (model == null) {
            throw new IllegalStateException("등록되지 않은 모델: " + modelId);
        }
        if (!model.isActive()) {
            throw new IllegalStateException("사용 중지된 모델: " + model.getModelKey());
        }

        GenerationProvider provider = providers.get(model.getProvider());
        if (provider == null) {
            throw new IllegalStateException("연동되지 않은 제공사: " + model.getProvider());
        }

        String prompt = fillVariables((String) def.get("prompt"), variables);

        // 파라미터에도 변수를 넣는다. 사용자가 고른 값이 지시문뿐 아니라 모델 설정까지
        // 바꿔야 하는 경우가 있다 — 영상 해상도가 그렇다. 고른 값에 따라 요금이 두 배 갈린다.
        Map<String, Object> params = fillVariablesIn(castMap(def.get("params")), variables);
        params = withReferenceVideo(params, job.getTemplateId());
        Map<String, String> resolved = resolveInputs(castStringMap(def.get("inputs")), stepOutputs, job);

        // 프롬프트의 @이름 표시를 모델이 읽을 말로 바꾸고, 사진을 부르는 차례대로 세운다.
        PhotoReferences.Resolved photos = PhotoReferences.apply(prompt, resolved);

        String externalId = provider.submit(new GenerationProvider.StepRequest(
                model.getModelKey(), photos.prompt(), params, photos.files()));

        // 끝날 때까지 기다린다. 제한 시간을 두어 영원히 붙잡고 있지 않게 한다.
        Instant deadline = Instant.now().plus(STEP_TIMEOUT);
        while (Instant.now().isBefore(deadline)) {
            GenerationProvider.StepStatus status = provider.poll(externalId);

            if (status == GenerationProvider.StepStatus.SUCCEEDED) {
                try (GenerationProvider.ResultStream result = provider.openResult(externalId)) {
                    // 외부 URL은 대개 만료되므로 받는 즉시 우리 쪽으로 옮긴다.
                    String key = "%s/%d/%s%s".formatted(
                            properties.supabase().storage().outputBucket(),
                            job.getId(),
                            UUID.randomUUID(),
                            extensionOf(result.contentType()));

                    save(key, result);
                    return new StepResult(key, result.contentType());
                }
            }

            if (status == GenerationProvider.StepStatus.FAILED) {
                throw new IllegalStateException("제공사가 실패로 응답: " + model.getProvider());
            }

            sleep(Duration.ofSeconds(2));
        }
        throw new IllegalStateException("단계 제한 시간 초과: " + model.getModelKey());
    }

    /** 사용자 입력을 프롬프트 변수로 만든다. 업로드는 파일이므로 변수에 넣지 않는다. */
    private Map<String, Object> resolveVariables(GenerationJob job) {
        Map<String, Object> variables = new HashMap<>();
        job.getInputs().forEach((key, value) -> {
            if (!(value instanceof Number)) {
                variables.put(key, value);
            }
        });
        return variables;
    }

    /**
     * 이 단계가 받을 파일들을 찾는다.
     *
     * <p>키는 지시문에 적힌 {@code @이름}이다. 값은 운영자가 적어둔 설명이거나
     * {@code steps[0].output} 같은 앞 단계 참조다.
     *
     * <p>사용자가 올린 사진은 {@code @}를 뗀 이름으로 찾는다. 업로드 칸이 지시문의 표시에서
     * 만들어지므로 둘은 항상 같은 이름을 쓴다 — 따로 이어줄 것이 없다.
     */
    private Map<String, String> resolveInputs(
            Map<String, String> inputs, Map<String, String> stepOutputs, GenerationJob job) {

        // 넣은 차례를 지킨다. 어느 사진이 몇 번째인지가 지시문의 뜻을 바꾼다.
        Map<String, String> resolved = new java.util.LinkedHashMap<>();

        inputs.forEach((token, reference) -> {
            if (reference != null && STEP_REFERENCE.matcher(reference).matches()) {
                String key = stepOutputs.get(reference);
                if (key != null) {
                    resolved.put(token, key);
                }
                return;
            }

            String fieldKey = token.startsWith("@") ? token.substring(1) : token;
            Long uploadId = asLong(job.getInputs().get(fieldKey));

            if (uploadId != null) {
                uploads.findById(uploadId).ifPresent(u -> resolved.put(token, u.getStorageKey()));
            }
        });
        return resolved;
    }


    /**
     * 템플릿의 레퍼런스 영상을 파라미터에 끼워 넣는다.
     *
     * <p>영상을 다시 짓는 모델은 바탕이 될 영상이 있어야 한다. 그 영상은 사용자가 아니라 템플릿이
     * 가진다 — 관리자가 등록할 때 한 번 올리고, 사용자는 갈아 끼울 사진만 올린다. 그래야 원가가
     * 템플릿마다 고정된다. 그런 모델은 결과가 아니라 입력 영상의 길이로 요금을 매기므로,
     * 사용자가 영상을 올리게 두면 올리는 사람이 우리 청구서를 정하게 된다.
     *
     * <p>파이프라인에 값이 적혀 있으면 그쪽을 존중한다. 영상이 여럿인 파이프라인에서 특정한
     * 것을 가리켜야 할 때가 있다.
     */
    private Map<String, Object> withReferenceVideo(Map<String, Object> params, Long templateId) {
        if (params.get("referenceVideo") != null || templateId == null) {
            return params;
        }

        String key = templates.findById(templateId)
                .map(com.prompick.template.domain.Template::getReferenceVideoKey)
                .filter(value -> !value.isBlank())
                .orElse(null);

        if (key == null) {
            return params;
        }

        Map<String, Object> withVideo = new HashMap<>(params);
        withVideo.put("referenceVideo", key);
        return withVideo;
    }

    /** 파라미터 값 안의 {{이름}}을 사용자가 고른 값으로 바꾼다. 문자열 값만 해당된다 */
    private Map<String, Object> fillVariablesIn(
            Map<String, Object> params, Map<String, Object> variables) {

        if (params == null || params.isEmpty()) {
            return params == null ? Map.of() : params;
        }

        Map<String, Object> filled = new HashMap<>(params);
        filled.replaceAll(
                (key, value) ->
                        value instanceof String text ? fillVariables(text, variables) : value);
        return filled;
    }

    private String fillVariables(String template, Map<String, Object> variables) {
        if (template == null) return "";
        Matcher matcher = VARIABLE.matcher(template);
        StringBuilder out = new StringBuilder();
        while (matcher.find()) {
            Object value = variables.get(matcher.group(1));
            matcher.appendReplacement(out, Matcher.quoteReplacement(value == null ? "" : value.toString()));
        }
        matcher.appendTail(out);
        return out.toString();
    }

    private static ContentType mediaTypeOf(String contentType, ContentType fallback) {
        if (contentType == null) return fallback;
        if (contentType.startsWith("video/")) return ContentType.VIDEO;
        if (contentType.startsWith("image/")) return ContentType.IMAGE;
        return fallback;
    }

    private static String extensionOf(String contentType) {
        if (contentType == null) return "";
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/jpeg" -> ".jpg";
            case "image/webp" -> ".webp";
            case "image/svg+xml" -> ".svg";
            case "video/mp4" -> ".mp4";
            case "video/webm" -> ".webm";
            default -> "";
        };
    }

    /**
     * 결과를 저장소로 옮긴다.
     *
     * <p>길이를 아는 경우에는 그대로 흘려보낸다. 모르는 경우에만 임시 파일을 거치는데,
     * 저장소가 올리기 전에 길이를 알아야 하기 때문이다. 어느 쪽이든 파일 전체가 메모리에
     * 올라오지 않는다 — 영상은 수십 MB라 통째로 들면 컨테이너가 죽는다.
     */
    private void save(String key, GenerationProvider.ResultStream result) {
        if (result.contentLength() >= 0) {
            storage.put(key, result.content(), result.contentType(), result.contentLength());
            return;
        }

        Path spool = null;
        try {
            spool = Files.createTempFile("prompick-result-", ".bin");
            Files.copy(result.content(), spool, StandardCopyOption.REPLACE_EXISTING);
            try (InputStream in = Files.newInputStream(spool)) {
                storage.put(key, in, result.contentType(), Files.size(spool));
            }
        } catch (IOException e) {
            throw new IllegalStateException("결과를 저장하지 못했다", e);
        } finally {
            if (spool != null) {
                try {
                    Files.deleteIfExists(spool);
                } catch (IOException ignored) {
                    // 임시 파일이 남는 것은 다음 재시작에 정리된다. 제작을 실패시킬 일은 아니다.
                }
            }
        }
    }

    private static void sleep(Duration duration) {
        try {
            Thread.sleep(duration.toMillis());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("중단됨", e);
        }
    }

    private static Long asLong(Object value) {
        if (value instanceof Number n) return n.longValue();
        if (value instanceof String s) {
            try {
                return Long.valueOf(s);
            } catch (NumberFormatException ignored) {
                return null;
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> castMap(Object value) {
        return value instanceof Map<?, ?> m ? (Map<String, Object>) m : Map.of();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, String> castStringMap(Object value) {
        return value instanceof Map<?, ?> m ? (Map<String, String>) m : Map.of();
    }

    private record StepResult(String storageKey, String contentType) {}

    /** 어느 단계에서 실패했는지 알려준다. */
    public static class StepFailedException extends RuntimeException {

        private final int stepIndex;

        public StepFailedException(int stepIndex, Throwable cause) {
            super("단계 %d 실패".formatted(stepIndex), cause);
            this.stepIndex = stepIndex;
        }

        public int getStepIndex() {
            return stepIndex;
        }
    }
}
