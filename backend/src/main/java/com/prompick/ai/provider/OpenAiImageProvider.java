package com.prompick.ai.provider;

import tools.jackson.databind.JsonNode;
import com.prompick.ai.app.ProviderCredentialService;
import com.prompick.ai.domain.Provider;
import com.prompick.config.PrompickProperties;
import com.prompick.storage.StorageService;
import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * OpenAI 이미지 생성.
 *
 * <p>OpenAI로 이미지를 만드는 길은 두 갈래다. 어느 쪽을 탈지는 파이프라인 단계의 {@code api}
 * 파라미터가 정한다.
 *
 * <ul>
 *   <li>{@code images} — 이미지 API를 직접 부른다. 프롬프트가 곧 그림 지시일 때 빠르고 싸다.
 *   <li>{@code responses} — 추론 모델에게 사진과 지시문을 함께 주고, 그 모델이 이미지 생성 툴을
 *       부르게 한다. ChatGPT 화면에서 이미지를 만들 때 실제로 일어나는 일이 이것이다.
 * </ul>
 *
 * <p>"누끼를 따서", "3~7개를 모두 다르게"처럼 <em>해석</em>이 필요한 긴 지시문은 responses 쪽이
 * 훨씬 잘 따른다. 그림 모델은 글을 읽고 판단하지 않지만, 그 앞에 선 추론 모델은 읽고 판단한다.
 *
 * <p>OpenAI 이미지 API는 한 번의 호출로 결과까지 돌려주지만, 여기서는 제출과 확인을 나눈 인터페이스에
 * 맞춰 백그라운드로 던지고 상태만 알려준다. 한 장에 1~3분이 걸리는데 그동안 워커 스레드를 붙잡고 있으면
 * 다른 사람의 작업이 줄줄이 밀린다.
 *
 * <p>프롬프트 원문은 어떤 경우에도 로그에 남기지 않는다. 이 글이 우리가 파는 것이다.
 */
@Component
public class OpenAiImageProvider implements GenerationProvider {

    private static final Logger log = LoggerFactory.getLogger(OpenAiImageProvider.class);

    /** 끝난 작업을 언제까지 들고 있을지. 결과를 가져간 뒤에는 바로 버린다 */
    private static final Duration RESULT_TTL = Duration.ofMinutes(10);

    /**
     * 이미지 툴 앞에 세울 추론 모델의 기본값.
     *
     * <p>이 자리가 하는 일은 사진을 보고 지시문을 읽어 툴을 부르는 것이 전부다. 실제로 재보니
     * 출력이 500 토큰도 되지 않아, 출력 단가가 비싼 상위 모델을 쓸 이유가 없었다.
     *
     * <p>파이프라인이 {@code mainlineModel} 을 지정하면 그쪽이 이긴다. 모델 이름은 자주 바뀌므로
     * 배포 없이 관리자 화면에서 고칠 수 있어야 한다.
     */
    private static final String DEFAULT_MAINLINE_MODEL = "gpt-5.4";

    private final PrompickProperties.Ai.OpenAi config;
    private final ProviderCredentialService credentials;
    private final StorageService storage;
    private final RestClient client;

    /** 진행 중이거나 막 끝난 호출들 */
    private final Map<String, Call> calls = new ConcurrentHashMap<>();

    /**
     * 외부 호출 전용 스레드.
     *
     * <p>가상 스레드를 쓴다. 대부분의 시간을 응답 대기로 보내므로 플랫폼 스레드를 점유할 이유가 없다.
     */
    private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

    public OpenAiImageProvider(
            PrompickProperties properties,
            ProviderCredentialService credentials,
            StorageService storage) {
        this.config = properties.ai().openai();
        this.credentials = credentials;
        this.storage = storage;

        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(15));
        factory.setReadTimeout(Duration.ofSeconds(config.timeoutSeconds()));

        this.client = RestClient.builder()
                .baseUrl(config.baseUrl())
                .requestFactory(factory)
                .build();

    }

    @Override
    public Provider type() {
        return Provider.OPENAI;
    }

    @Override
    public String submit(StepRequest request) {
        // 매 호출마다 다시 꺼낸다. 관리자가 화면에서 키를 바꾸면 재시작 없이 바로 반영되어야 한다.
        String apiKey = credentials.keyFor(Provider.OPENAI)
                .orElseThrow(() -> new IllegalStateException(
                        "OpenAI 키가 없습니다. 관리자 화면의 제공사 키에서 넣어주세요"));

        String id = "openai-" + UUID.randomUUID();
        log.debug("OpenAI 이미지 요청: {} (모델 {}, 입력파일 {}개)",
                id, request.modelKey(), request.inputFiles().size());

        CompletableFuture<Result> future =
                CompletableFuture.supplyAsync(() -> callOpenAi(request, apiKey), executor);

        calls.put(id, new Call(future, System.nanoTime()));
        return id;
    }

    @Override
    public StepStatus poll(String externalJobId) {
        Call call = calls.get(externalJobId);
        if (call == null) {
            return StepStatus.FAILED;
        }
        if (!call.future().isDone()) {
            return StepStatus.RUNNING;
        }
        return call.future().isCompletedExceptionally() ? StepStatus.FAILED : StepStatus.SUCCEEDED;
    }

    @Override
    public byte[] fetchResult(String externalJobId) {
        return resultOf(externalJobId).bytes();
    }

    @Override
    public String resultContentType(String externalJobId) {
        return resultOf(externalJobId).contentType();
    }

    /**
     * 키가 살아 있는지, 어떤 모델을 쓸 수 있는지 본다.
     *
     * <p>모델 목록 조회는 요금이 붙지 않는다. 파이프라인에 적어둔 모델 이름이 실제로 계정에서
     * 보이는지 여기서 확인할 수 있다 — 모델 이름은 생각보다 자주 바뀐다.
     */
    @Override
    public ProviderCheck check() {
        String apiKey = credentials.keyFor(Provider.OPENAI).orElse(null);
        if (apiKey == null) {
            return new ProviderCheck(false, "키가 없어요", List.of());
        }

        try {
            JsonNode response = client.get()
                    .uri("/v1/models")
                    .header("Authorization", "Bearer " + apiKey)
                    .retrieve()
                    .body(JsonNode.class);

            List<String> models = new ArrayList<>();
            if (response != null) {
                for (JsonNode model : response.path("data")) {
                    String id = model.path("id").asText("");
                    // 이미지 만들 때 쓰는 것만 추린다. 전체를 내려보내면 수백 개다.
                    if (id.contains("image") || id.startsWith("gpt-5") || id.startsWith("gpt-6")) {
                        models.add(id);
                    }
                }
            }
            models.sort(String::compareTo);
            return new ProviderCheck(true, "키가 정상이에요", models);

        } catch (RestClientException e) {
            return new ProviderCheck(false, "키를 확인하지 못했어요: " + summarize(e), List.of());
        }
    }

    private Result resultOf(String externalJobId) {
        Call call = calls.get(externalJobId);
        if (call == null) {
            throw new IllegalStateException("만료되었거나 없는 요청: " + externalJobId);
        }
        try {
            return call.future().get();
        } catch (ExecutionException e) {
            throw asRuntime(e.getCause());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("중단됨", e);
        } finally {
            sweep();
        }
    }

    /**
     * 실제 호출.
     *
     * <p>업로드한 사진을 스토리지에서 읽어 그대로 실어 보낸다. 사진이 없으면 글만으로 만든다.
     */
    private Result callOpenAi(StepRequest request, String apiKey) {
        // 프롬프트가 부르는 차례 그대로다. 순서가 바뀌면 "첫 번째 사진"이 다른 것을 가리키게 된다.
        List<String> imageKeys = List.copyOf(request.inputFiles().values());
        boolean viaResponses = "responses".equalsIgnoreCase(str(request.params().get("api")));

        String base64 = viaResponses
                ? respond(request, imageKeys, apiKey)
                : imagesApi(request, imageKeys, apiKey);

        if (base64 == null || base64.isBlank()) {
            throw new IllegalStateException("OpenAI 응답에 이미지가 없습니다");
        }
        return new Result(Base64.getDecoder().decode(base64), "image/png");
    }

    /** 이미지 API를 직접 부른다 */
    private String imagesApi(StepRequest request, List<String> imageKeys, String apiKey) {
        JsonNode response = imageKeys.isEmpty()
                ? generate(request, apiKey)
                : edit(request, imageKeys, apiKey);
        return response.path("data").path(0).path("b64_json").asText(null);
    }

    /**
     * 추론 모델에게 맡긴다.
     *
     * <p>사진과 지시문을 한 번에 주면 모델이 사진을 보고 지시문을 해석한 뒤 이미지 생성 툴을 부른다.
     * 우리가 그림 모델에게 직접 말을 거는 대신, 우리 말을 알아듣는 쪽을 중간에 세우는 것이다.
     */
    private String respond(StepRequest request, List<String> imageKeys, String apiKey) {
        List<Map<String, Object>> content = new ArrayList<>();
        content.add(Map.of("type", "input_text", "text", request.prompt()));

        // 사진을 차례대로 싣는다. 글에서 부르는 차례와 같아야 모델이 어느 것인지 안다.
        for (String key : imageKeys) {
            content.add(Map.of("type", "input_image", "image_url", dataUrl(key)));
        }

        Map<String, Object> tool = new LinkedHashMap<>();
        tool.put("type", "image_generation");
        tool.put("model", request.modelKey());
        tool.put("action", imageKeys.isEmpty() ? "generate" : "edit");
        putIfPresent(tool, "size", ImageSize.resolve(str(request.params().get("size"))));
        putIfPresent(tool, "quality", request.params().get("quality"));

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", str(request.params().getOrDefault("mainlineModel", DEFAULT_MAINLINE_MODEL)));
        body.put("input", List.of(Map.of("role", "user", "content", content)));
        body.put("tools", List.of(tool));

        JsonNode response = post("/v1/responses", MediaType.APPLICATION_JSON, body, apiKey);

        // 앞에 세운 추론 모델이 토큰을 얼마나 썼는지 남긴다. 이 값이 없으면 어느 모델을 쓸지
        // 추측으로만 고르게 된다 — 이미지 요금과 달리 토큰 요금은 지시문 길이에 따라 크게 변한다.
        JsonNode usage = response.path("usage");
        if (!usage.isMissingNode()) {
            log.info("추론 모델 토큰: 입력 {} 출력 {} (모델 {})",
                    usage.path("input_tokens").asInt(),
                    usage.path("output_tokens").asInt(),
                    body.get("model"));
        }

        for (JsonNode item : response.path("output")) {
            if ("image_generation_call".equals(item.path("type").asText())) {
                return item.path("result").asText(null);
            }
        }
        // 툴을 부르지 않고 글로만 답했다면 지시문이 거절당했다는 뜻이다.
        throw new IllegalStateException("모델이 이미지를 만들지 않았습니다 (지시문이 거절되었을 수 있음)");
    }

    /** 스토리지에 있는 사진을 그대로 실어 보낼 수 있는 형태로 만든다 */
    private String dataUrl(String storageKey) {
        byte[] bytes = read(storageKey);
        return "data:" + mimeOf(storageKey) + ";base64," + Base64.getEncoder().encodeToString(bytes);
    }

    private static String mimeOf(String storageKey) {
        String lower = storageKey.toLowerCase();
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        return "image/jpeg";
    }

    private static String str(Object value) {
        return value == null ? null : value.toString();
    }

    /** 사진을 바탕으로 만든다 */
    private JsonNode edit(StepRequest request, List<String> imageKeys, String apiKey) {
        MultiValueMap<String, Object> form = new LinkedMultiValueMap<>();
        form.add("model", request.modelKey());
        form.add("prompt", request.prompt());
        form.add("n", "1");

        // 여러 장이면 같은 이름으로 여러 번 싣는다. 이미지 API는 이 형태로 배열을 받는다.
        String field = imageKeys.size() > 1 ? "image[]" : "image";
        for (String key : imageKeys) {
            form.add(field, namedImage(read(key), key));
        }

        // 비율("9:16")로 적혀 있으면 픽셀로 바꿔 보낸다. 제공사는 픽셀만 받는다.
        putIfPresent(form, "size", ImageSize.resolve(str(request.params().get("size"))));
        putIfPresent(form, "quality", request.params().get("quality"));

        // 모델이 요구할 때만 보낸다. gpt-image-2는 입력 이미지를 항상 고충실도로 다루기 때문에
        // 이 값을 보내면 오히려 오류로 거절한다. 어느 쪽인지는 파이프라인 파라미터가 정한다.
        putIfPresent(form, "input_fidelity", request.params().get("inputFidelity"));

        return post("/v1/images/edits", MediaType.MULTIPART_FORM_DATA, form, apiKey);
    }

    /** 글만으로 만든다 */
    private JsonNode generate(StepRequest request, String apiKey) {
        Map<String, Object> body = new java.util.HashMap<>();
        body.put("model", request.modelKey());
        body.put("prompt", request.prompt());
        body.put("n", 1);
        putIfPresent(body, "size", ImageSize.resolve(str(request.params().get("size"))));
        putIfPresent(body, "quality", request.params().get("quality"));

        return post("/v1/images/generations", MediaType.APPLICATION_JSON, body, apiKey);
    }

    private JsonNode post(String path, MediaType contentType, Object body, String apiKey) {
        try {
            JsonNode response = client.post()
                    .uri(path)
                    .header("Authorization", "Bearer " + apiKey)
                    .contentType(contentType)
                    .body(body)
                    .retrieve()
                    .body(JsonNode.class);

            if (response == null) {
                throw new IllegalStateException("OpenAI가 빈 응답을 보냈습니다");
            }
            return response;

        } catch (RestClientException e) {
            // 메시지에 프롬프트가 섞여 나올 수 있으므로 그대로 흘리지 않는다.
            log.warn("OpenAI 호출 실패: {}", summarize(e));
            throw new IllegalStateException("OpenAI 호출 실패: " + summarize(e));
        }
    }

    private byte[] read(String storageKey) {
        try (InputStream in = storage.get(storageKey)) {
            return in.readAllBytes();
        } catch (IOException e) {
            throw new IllegalStateException("업로드한 사진을 읽지 못했습니다", e);
        }
    }

    /**
     * 멀티파트에 실을 파일.
     *
     * <p>파일 이름이 없으면 OpenAI가 형식을 알아보지 못한다. 저장 키의 확장자를 그대로 붙여 준다.
     */
    private static Resource namedImage(byte[] bytes, String storageKey) {
        String extension = storageKey.contains(".")
                ? storageKey.substring(storageKey.lastIndexOf('.'))
                : ".png";

        return new ByteArrayResource(bytes) {
            @Override
            public String getFilename() {
                return "input" + extension;
            }
        };
    }

    private static void putIfPresent(MultiValueMap<String, Object> form, String key, Object value) {
        if (value != null && !value.toString().isBlank()) {
            form.add(key, value.toString());
        }
    }

    private static void putIfPresent(Map<String, Object> body, String key, Object value) {
        if (value != null && !value.toString().isBlank()) {
            body.put(key, value.toString());
        }
    }

    /**
     * 예외에서 사람이 고칠 수 있는 부분만 남긴다.
     *
     * <p>너무 짧게 자르면 정작 필요한 부분이 날아간다. 한도 초과 응답은 "얼마가 한도이고 지금
     * 얼마를 썼는지"가 메시지 뒷부분에 붙어 오는데, 그게 없으면 무엇을 줄여야 할지 알 수 없다.
     */
    private static String summarize(Exception e) {
        String message = e.getMessage();
        if (message == null) {
            return e.getClass().getSimpleName();
        }
        String flattened = message.replaceAll("\s+", " ");
        return flattened.length() > 600 ? flattened.substring(0, 600) : flattened;
    }

    private static RuntimeException asRuntime(Throwable cause) {
        return cause instanceof RuntimeException r ? r : new IllegalStateException(cause);
    }

    /** 오래된 기록을 버린다. 결과 바이트를 계속 들고 있으면 메모리가 샌다 */
    private void sweep() {
        long cutoff = System.nanoTime() - RESULT_TTL.toNanos();
        calls.entrySet().removeIf(e -> e.getValue().startedAt() < cutoff && e.getValue().future().isDone());
    }

    private record Call(CompletableFuture<Result> future, long startedAt) {}

    private record Result(byte[] bytes, String contentType) {}
}
