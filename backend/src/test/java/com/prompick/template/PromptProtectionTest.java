package com.prompick.template;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;

/**
 * 사용자용 API 응답에 파이프라인 정보가 새지 않는지 검증한다. (확정 기획 4장 규칙 7번)
 *
 * <p>이 테스트는 "필드 이름"과 "실제 내부 프롬프트 내용" 두 가지를 모두 본다. 필드 이름만 검사하면
 * 다른 이름으로 담아 보내는 실수를 잡지 못하기 때문이다.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class PromptProtectionTest {

    /** 응답에 절대 나오면 안 되는 키 */
    private static final List<String> FORBIDDEN_KEYS = List.of(
            "pipeline", "pipelines", "steps", "modelid", "model", "modelkey", "provider",
            "params", "externaljobid", "adminmemo", "internalprompt");

    /** 응답에 절대 나오면 안 되는 값 조각 (시드 파이프라인에 심어둔 표식) */
    private static final List<String> FORBIDDEN_VALUES = List.of(
            "INTERNAL:", "octane render", "anamorphic lens flare", "cyclorama",
            "참고 원본", "독점 상품. 프롬프트 공개 금지");

    @LocalServerPort
    int port;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = HttpClient.newHttpClient();

    @Test
    @DisplayName("홈 응답에 파이프라인이 없다")
    void home() throws Exception {
        assertClean(get("/api/v1/home"));
    }

    @Test
    @DisplayName("목록 응답에 파이프라인이 없다")
    void list() throws Exception {
        assertClean(get("/api/v1/templates?size=40"));
    }

    /**
     * 공개된 템플릿 전부를 하나씩 열어본다.
     *
     * <p>예전에는 슬러그 세 개를 적어두고 그것만 봤다. 그러다 V31 이 그중 둘을 비공개로
     * 돌리자 테스트가 404 를 받고 넘어졌는데, 한동안 아무도 몰랐다 — 프롬프트가 새는지
     * 봐주는 장치가 그 사이 꺼져 있었다는 뜻이다.
     *
     * <p>그래서 목록에서 받아온 것을 전부 훑는다. 시드가 바뀌어도 따라가고, 관리자가 새로
     * 만든 템플릿까지 같이 검사한다. 규칙은 템플릿마다 자기가 선언한 공개 수준으로 판단한다.
     */
    @Test
    @DisplayName("공개된 모든 템플릿이 공개 수준에 맞게만 내려준다")
    void everyPublishedTemplate() throws Exception {
        JsonNode items = mapper.readTree(get("/api/v1/templates?size=100")).path("items");

        assertThat(items.isArray() && !items.isEmpty())
                .as("공개된 템플릿이 하나도 없으면 이 검사는 아무것도 지켜주지 못한다")
                .isTrue();

        for (JsonNode card : items) {
            String slug = card.path("slug").asText();
            String raw = get("/api/v1/templates/" + slug);
            JsonNode body = mapper.readTree(raw);

            // 공개 수준과 상관없이, 실행용 파이프라인은 어느 경우에도 내려가지 않는다.
            assertClean(raw);

            String access = body.path("promptAccess").asText();
            JsonNode prompt = body.path("prompt");
            boolean hasPrompt = !(prompt.isNull() || prompt.isMissingNode());

            switch (access) {
                case "FREE" -> assertThat(hasPrompt)
                        .as("%s: 프롬프트를 공개한 템플릿인데 원문이 없다", slug)
                        .isTrue();
                case "HIDDEN", "PAID" -> assertThat(hasPrompt)
                        .as("%s: 공개 수준이 %s 인데 원문이 내려갔다", slug, access)
                        .isFalse();
                default -> throw new AssertionError(
                        slug + ": 알 수 없는 공개 수준 \"" + access + "\"");
            }
        }
    }

    private String get(String path) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:" + port + path))
                    .GET()
                    .build();
            return http.send(request, HttpResponse.BodyHandlers.ofString(java.nio.charset.StandardCharsets.UTF_8))
                    .body();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private void assertClean(String json) throws Exception {
        JsonNode root = mapper.readTree(json);

        List<String> foundKeys = new ArrayList<>();
        collectKeys(root, foundKeys);
        assertThat(foundKeys)
                .as("사용자용 응답에 파이프라인 관련 키가 있으면 안 된다")
                .isEmpty();

        String lower = json.toLowerCase(Locale.ROOT);
        for (String forbidden : FORBIDDEN_VALUES) {
            assertThat(lower)
                    .as("사용자용 응답에 내부 프롬프트 내용(%s)이 있으면 안 된다", forbidden)
                    .doesNotContain(forbidden.toLowerCase(Locale.ROOT));
        }
    }

    private void collectKeys(JsonNode node, List<String> found) {
        if (node.isObject()) {
            node.properties().forEach(entry -> {
                if (FORBIDDEN_KEYS.contains(entry.getKey().toLowerCase(Locale.ROOT))) {
                    found.add(entry.getKey());
                }
                collectKeys(entry.getValue(), found);
            });
        } else if (node.isArray()) {
            node.forEach(child -> collectKeys(child, found));
        }
    }
}
