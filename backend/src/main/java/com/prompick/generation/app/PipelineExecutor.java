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
import java.io.ByteArrayInputStream;
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
    private final StorageService storage;
    private final PrompickProperties properties;

    public PipelineExecutor(
            List<GenerationProvider> providerList,
            AiModelRepository models,
            JobStepRepository steps,
            OutputRepository outputs,
            UploadRepository uploads,
            StorageService storage,
            PrompickProperties properties) {
        this.providers = new HashMap<>();
        providerList.forEach(p -> this.providers.put(p.type(), p));
        this.models = models;
        this.steps = steps;
        this.outputs = outputs;
        this.uploads = uploads;
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
        Map<String, Object> params = castMap(def.get("params"));
        Map<String, String> inputFiles = resolveInputs(castStringMap(def.get("inputs")), stepOutputs, job);

        String externalId = provider.submit(
                new GenerationProvider.StepRequest(model.getModelKey(), prompt, params, inputFiles));

        // 끝날 때까지 기다린다. 제한 시간을 두어 영원히 붙잡고 있지 않게 한다.
        Instant deadline = Instant.now().plus(STEP_TIMEOUT);
        while (Instant.now().isBefore(deadline)) {
            GenerationProvider.StepStatus status = provider.poll(externalId);

            if (status == GenerationProvider.StepStatus.SUCCEEDED) {
                byte[] bytes = provider.fetchResult(externalId);
                String contentType = provider.resultContentType(externalId);

                // 외부 URL은 대개 만료되므로 받는 즉시 우리 쪽으로 옮긴다.
                String key = "%s/%d/%s%s".formatted(
                        properties.supabase().storage().outputBucket(),
                        job.getId(),
                        UUID.randomUUID(),
                        extensionOf(contentType));

                storage.put(key, new ByteArrayInputStream(bytes), contentType, bytes.length);
                return new StepResult(key, contentType);
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

    /** 이 단계가 받을 파일들을 찾는다. 앞 단계 결과이거나 사용자가 올린 사진이다. */
    private Map<String, String> resolveInputs(
            Map<String, String> inputs, Map<String, String> stepOutputs, GenerationJob job) {

        Map<String, String> resolved = new HashMap<>();
        inputs.forEach((name, reference) -> {
            Matcher stepMatch = STEP_REFERENCE.matcher(reference);
            if (stepMatch.matches()) {
                String key = stepOutputs.get(reference);
                if (key != null) {
                    resolved.put(name, key);
                }
                return;
            }

            // 입력 필드 이름이면 사용자가 올린 사진을 찾는다.
            Object value = job.getInputs().get(reference);
            Long uploadId = asLong(value);
            if (uploadId != null) {
                uploads.findById(uploadId).ifPresent(u -> resolved.put(name, u.getStorageKey()));
            }
        });
        return resolved;
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
        if (contentType.startsWith("audio/")) return ContentType.AUDIO;
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
