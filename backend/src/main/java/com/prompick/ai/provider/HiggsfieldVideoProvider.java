package com.prompick.ai.provider;

import com.prompick.ai.app.ProviderCredentialService;
import com.prompick.ai.domain.Provider;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

/**
 * Higgsfield 영상 생성 어댑터.
 *
 * <p>Genjutsu 는 이미 찍힌 영상의 움직임을 그대로 두고 그 안의 인물이나 사물을 바꾼다. 그래서
 * 입력이 사진이 아니라 영상이고, 요금도 결과가 아니라 <b>입력 영상의 길이</b>에 비례한다.
 * 30초짜리를 올리면 720p 기준 한 번에 2만원이 넘는다. 길이 제한이 곧 원가 제한이다.
 *
 * <p>어느 모델을 부를지는 코드에 박지 않고 AI 모델 화면의 모델 이름으로 받는다. Genjutsu 안에만
 * 모션 트랜스퍼와 오브젝트 스왑이 있고 버전도 올라가는데, 그때마다 배포할 이유가 없다.
 *
 * <p>제출과 결과 확인을 나눠 쓴다. 이 API 에는 한 번의 호출로 끝날 때까지 기다려주는
 * {@code withPolling} 옵션이 있지만 쓰지 않는다 — 영상은 수 분이 걸려서, 그동안 워커 스레드가
 * 묶이고 서버가 재시작되면 진행 상황을 통째로 잃는다.
 */
@Component
public class HiggsfieldVideoProvider implements GenerationProvider {

    private static final Logger log = LoggerFactory.getLogger(HiggsfieldVideoProvider.class);

    private static final String BASE_URL = "https://api.higgsfield.ai";

    /**
     * 입력 파일을 건네줄 서명 주소의 유효 시간.
     *
     * <p>넉넉해야 한다. 제출한 뒤 저쪽 큐에서 기다리다 받아가므로, 짧게 잡으면 큐가 밀린 날
     * 주소가 먼저 만료되어 "우리는 잘 보냈는데 저쪽은 못 받는" 일이 생긴다.
     */
    private static final Duration INPUT_URL_TTL = Duration.ofHours(6);

    private static final Duration HTTP_TIMEOUT = Duration.ofSeconds(30);

    /** 영상으로 볼 확장자. 어느 입력이 영상이고 어느 것이 참조 사진인지 가르는 데 쓴다 */
    private static final List<String> VIDEO_EXTENSIONS =
            List.of(".mp4", ".mov", ".webm", ".m4v", ".avi");

    private final RestClient client;
    private final ProviderCredentialService credentials;
    private final com.prompick.storage.StorageService storage;

    /**
     * 제출한 작업의 상태 주소.
     *
     * <p>제출 응답이 알려주는 주소를 그대로 쓴다. 경로를 우리가 조립하면 저쪽이 주소 체계를
     * 바꿀 때마다 같이 고쳐야 한다.
     */
    private final Map<String, String> statusUrls = new ConcurrentHashMap<>();

    /** 완성된 결과 주소. 폴링에서 찾으면 담아두었다가 내려받을 때 쓴다 */
    private final Map<String, String> resultUrls = new ConcurrentHashMap<>();

    public HiggsfieldVideoProvider(
            ProviderCredentialService credentials, com.prompick.storage.StorageService storage) {
        this.credentials = credentials;
        this.storage = storage;

        org.springframework.http.client.SimpleClientHttpRequestFactory factory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(HTTP_TIMEOUT);
        factory.setReadTimeout(HTTP_TIMEOUT);

        this.client = RestClient.builder().baseUrl(BASE_URL).requestFactory(factory).build();
    }

    @Override
    public Provider type() {
        return Provider.HIGGSFIELD;
    }

    @Override
    public String submit(StepRequest request) {
        String auth = authHeader();

        // 레퍼런스 영상은 템플릿이 가진다. 사용자가 올리는 것은 갈아 끼울 사진뿐이다.
        //
        // 이렇게 두는 이유가 있다. 이 제공사는 결과가 아니라 <입력 영상의 길이>로 요금을
        // 매긴다. 길이를 관리자가 정해두면 템플릿마다 1회 원가가 고정되고, 사용자가 올리게
        // 두면 올리는 사람이 우리 청구서를 정하게 된다.
        String videoKey = str(request.params().get("referenceVideo"));
        String videoUrl = null;

        List<String> imageUrls = new ArrayList<>();
        for (String storageKey : request.inputFiles().values()) {
            String url = storage.presignDownload(storageKey, INPUT_URL_TTL);
            // 앞 단계가 영상을 내놓는 파이프라인이라면 그것을 레퍼런스로 쓴다.
            if (videoKey == null && isVideo(storageKey) && videoUrl == null) {
                videoUrl = url;
            } else {
                imageUrls.add(url);
            }
        }

        if (videoKey != null) {
            videoUrl = storage.presignDownload(videoKey, INPUT_URL_TTL);
        }

        if (videoUrl == null) {
            throw new IllegalStateException(
                    "참조 영상이 없다. 파이프라인 params 에 referenceVideo 를 적어야 한다");
        }

        // 본문은 평평하다. 플레이그라운드가 보여주는 {"input": {...}} 는 SDK 호출 모양이고,
        // 실제 HTTP 는 파라미터를 그대로 받는다. 그것을 모르고 감싸 보냈다가
        // "'video_url' is a required property" 로 거절당했다.
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("prompt", request.prompt() == null ? "" : request.prompt());
        body.put("video_url", videoUrl);
        body.put("image_urls", imageUrls);
        body.put("resolution", resolutionOf(request.params()));

        JsonNode response = client.post()
                .uri("/" + request.modelKey())
                .header("Authorization", auth)
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(JsonNode.class);

        if (response == null) {
            throw new IllegalStateException("Higgsfield 가 빈 응답을 보냈다");
        }

        String requestId = text(response, "request_id", "id", "requestId");
        if (requestId == null) {
            throw new IllegalStateException("Higgsfield 응답에 작업 id 가 없다");
        }

        String statusUrl = text(response, "status_url", "statusUrl");
        if (statusUrl != null) {
            statusUrls.put(requestId, statusUrl);
        }

        log.info("Higgsfield 제출: model={}, 참조사진={}장", request.modelKey(), imageUrls.size());
        return requestId;
    }

    @Override
    public StepStatus poll(String externalJobId) {
        JsonNode response = getJson(statusUrlOf(externalJobId));
        if (response == null) {
            return StepStatus.RUNNING;
        }

        String status = text(response, "status", "state");
        if (status == null) {
            return StepStatus.RUNNING;
        }

        return switch (status.toLowerCase()) {
            case "completed", "succeeded", "success", "done" -> {
                String url = findResultUrl(response);
                if (url == null) {
                    // 끝났다면서 결과 주소가 없으면 실패로 본다. 계속 기다려봐야 오지 않는다.
                    // 응답의 키 이름을 남긴다 — 어디를 봐야 하는지 다음에 또 추측하지 않으려고.
                    log.warn(
                            "Higgsfield 완료 응답에 결과 주소가 없다: {} (응답 키: {})",
                            externalJobId,
                            response.propertyStream().map(java.util.Map.Entry::getKey).toList());
                    yield StepStatus.FAILED;
                }
                resultUrls.put(externalJobId, url);
                yield StepStatus.SUCCEEDED;
            }
            case "failed", "error", "canceled", "cancelled" -> StepStatus.FAILED;
            default -> StepStatus.RUNNING;
        };
    }

    /**
     * 결과를 흘려보낸다.
     *
     * <p>영상은 수십 MB 다. 바이트 배열로 들면 512MB 컨테이너는 그 자리에서 죽는다. 그래서
     * 응답 본문을 열어둔 채로 돌려주고, 저장소로 옮기는 쪽이 흘려보내며 읽는다.
     */
    @Override
    public ResultStream openResult(String externalJobId) {
        String url = resultUrls.get(externalJobId);
        if (url == null) {
            throw new IllegalStateException("아직 결과 주소를 모른다: " + externalJobId);
        }

        try {
            HttpResponse<InputStream> response =
                    HttpClient.newBuilder()
                            .connectTimeout(HTTP_TIMEOUT)
                            .followRedirects(HttpClient.Redirect.NORMAL)
                            .build()
                            .send(
                                    HttpRequest.newBuilder(URI.create(url))
                                            .timeout(HTTP_TIMEOUT)
                                            .GET()
                                            .build(),
                                    HttpResponse.BodyHandlers.ofInputStream());

            if (response.statusCode() / 100 != 2) {
                response.body().close();
                throw new IllegalStateException(
                        "결과를 받지 못했다: HTTP " + response.statusCode());
            }

            String contentType =
                    response.headers().firstValue("content-type").orElse("video/mp4");
            long length = response.headers().firstValueAsLong("content-length").orElse(-1);

            return new ResultStream(response.body(), contentType, length);

        } catch (java.io.IOException e) {
            throw new IllegalStateException("결과를 받지 못했다", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("결과를 받다가 중단됐다", e);
        }
    }

    /**
     * 키가 살아 있는지 본다.
     *
     * <p>영상을 만들지 않고 확인한다 — 한 번 만들면 수천 원이 나가는데, 연결 확인하자고 그 돈을
     * 쓸 수는 없다. 인증이 필요한 가벼운 경로를 불러 401 이 아닌지만 본다.
     */
    @Override
    public ProviderCheck check() {
        String raw = credentials.keyFor(Provider.HIGGSFIELD).orElse(null);
        if (raw == null) {
            return new ProviderCheck(false, "키가 없어요", List.of());
        }
        if (!raw.contains(":")) {
            return new ProviderCheck(
                    false,
                    "키 형식이 달라요. Key ID 와 Key Secret 을 콜론으로 이어 붙여 넣어주세요 (예: abc123:secret456)",
                    List.of());
        }

        try {
            HttpResponse<String> response =
                    HttpClient.newBuilder()
                            .connectTimeout(HTTP_TIMEOUT)
                            .build()
                            .send(
                                    HttpRequest.newBuilder(URI.create(BASE_URL + "/v1/models"))
                                            .timeout(HTTP_TIMEOUT)
                                            .header("Authorization", "Key " + raw)
                                            .GET()
                                            .build(),
                                    HttpResponse.BodyHandlers.ofString());

            int code = response.statusCode();
            if (code == 401 || code == 403) {
                return new ProviderCheck(false, "키가 거부됐어요 (HTTP " + code + ")", List.of());
            }
            return new ProviderCheck(
                    true, "연결됐어요 (HTTP " + code + ")", List.of());

        } catch (java.io.IOException e) {
            return new ProviderCheck(false, "연결하지 못했어요: " + e.getMessage(), List.of());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return new ProviderCheck(false, "확인 중 중단됐어요", List.of());
        }
    }

    /**
     * 인증 헤더.
     *
     * <p>이 제공사는 키가 두 조각이다. 우리는 {@code ID:SECRET} 한 줄로 저장하고, 헤더 형식이
     * 마침 {@code Key ID:SECRET} 이라 그대로 붙이면 된다.
     */
    private String authHeader() {
        String raw = credentials
                .keyFor(Provider.HIGGSFIELD)
                .orElseThrow(() -> new IllegalStateException("Higgsfield 키가 없다"));

        if (!raw.contains(":")) {
            throw new IllegalStateException(
                    "Higgsfield 키는 ID:SECRET 형식이어야 한다");
        }
        return "Key " + raw;
    }

    private String statusUrlOf(String externalJobId) {
        String url = statusUrls.get(externalJobId);
        if (url != null) {
            return url;
        }
        // 서버가 재시작되면 기억이 사라진다. 문서에 적힌 기본 경로로 되돌아간다.
        return BASE_URL + "/requests/" + externalJobId + "/status";
    }

    private JsonNode getJson(String url) {
        try {
            return client.get()
                    .uri(URI.create(url))
                    .header("Authorization", authHeader())
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RuntimeException e) {
            // 상태 확인이 한 번 실패했다고 제작을 실패시키지 않는다. 다음 차례에 다시 묻는다.
            log.debug("Higgsfield 상태 확인 실패: {}", e.toString());
            return null;
        }
    }

    /** 파라미터에서 문자열을 꺼낸다. 비어 있으면 null */
    private static String str(Object value) {
        if (value == null) {
            return null;
        }
        String text = String.valueOf(value).trim();
        return text.isEmpty() ? null : text;
    }

    /**
     * "480p" 또는 "720p".
     *
     * <p>이 값이 요금을 두 배 가른다. 그래서 모르겠으면 싼 쪽으로 떨어뜨린다 — 설정이 비어
     * 있을 때 비싼 쪽이 나가면, 실수를 알아채는 것은 청구서를 볼 때다.
     */
    private static String resolutionOf(Map<String, Object> params) {
        Object value = params == null ? null : params.get("resolution");
        String resolution = value == null ? "" : String.valueOf(value).trim();
        return "720p".equals(resolution) ? "720p" : "480p";
    }

    private static boolean isVideo(String storageKey) {
        String lower = storageKey.toLowerCase();
        return VIDEO_EXTENSIONS.stream().anyMatch(lower::endsWith);
    }

    /** 여러 이름 중 먼저 있는 것을 꺼낸다. 응답 형태가 문서마다 조금씩 달라 대비해 둔다 */
    private static String text(JsonNode node, String... names) {
        for (String name : names) {
            JsonNode found = node.path(name);
            if (found.isString() && !found.asString().isBlank()) {
                return found.asString();
            }
        }
        return null;
    }

    /**
     * 결과 영상 주소를 찾는다.
     *
     * <p>응답 어디에 담겨 오는지 실제로 확인하지 못해, 흔한 자리를 순서대로 뒤지고 그래도 없으면
     * 트리 전체에서 영상처럼 보이는 주소를 찾는다. 실제 응답을 한 번 보고 나면 이 함수는
     * 한 줄로 줄어들 것이다.
     */
    private static String findResultUrl(JsonNode root) {
        // 문서가 보여주는 자리. 영상도 같은 모양으로 온다고 보고 videos 를 함께 본다.
        for (String path : List.of("images", "videos", "results", "outputs")) {
            JsonNode array = root.path(path);
            if (array.isArray() && !array.isEmpty()) {
                String url = text(array.get(0), "url", "video_url", "output_url");
                if (url != null) {
                    return url;
                }
            }
        }

        for (String path : List.of("result", "output", "data")) {
            JsonNode node = root.path(path);
            String direct = text(node, "url", "video_url", "output_url");
            if (direct != null) {
                return direct;
            }
            if (node.isArray() && !node.isEmpty()) {
                String first = text(node.get(0), "url", "video_url", "output_url");
                if (first != null) {
                    return first;
                }
            }
        }

        String top = text(root, "url", "video_url", "output_url");
        if (top != null) {
            return top;
        }

        return searchForMediaUrl(root, 0);
    }

    private static String searchForMediaUrl(JsonNode node, int depth) {
        if (depth > 6) {
            return null;
        }
        if (node.isString()) {
            String value = node.asString();
            if (value.startsWith("http") && VIDEO_EXTENSIONS.stream().anyMatch(value::contains)) {
                return value;
            }
            return null;
        }
        for (JsonNode child : node) {
            String found = searchForMediaUrl(child, depth + 1);
            if (found != null) {
                return found;
            }
        }
        return null;
    }
}
