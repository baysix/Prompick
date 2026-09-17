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

    @Test
    @DisplayName("프롬프트를 공개하는 템플릿도 파이프라인은 내려주지 않는다")
    void disclosedTemplate() throws Exception {
        JsonNode body = mapper.readTree(get("/api/v1/templates/floating-product-ad"));

        // 공개용 프롬프트는 내려간다
        assertThat(body.path("promptAccess").asText()).isEqualTo("FREE");
        assertThat(body.path("prompt").path("body").asText()).contains("floating in mid-air");

        // 하지만 실행용 파이프라인은 아니다
        assertClean(body.toString());
    }

    @Test
    @DisplayName("프롬프트 비공개 템플릿은 원문 자체가 내려가지 않는다")
    void hiddenTemplate() throws Exception {
        JsonNode body = mapper.readTree(get("/api/v1/templates/cinematic-brand-film"));

        assertThat(body.path("promptAccess").asText()).isEqualTo("HIDDEN");
        assertThat(body.path("prompt").isNull() || body.path("prompt").isMissingNode())
                .as("비공개 템플릿에는 프롬프트가 없어야 한다")
                .isTrue();

        assertClean(body.toString());
    }

    @Test
    @DisplayName("유료 프롬프트는 구매 전까지 원문이 내려가지 않는다")
    void paidPromptNotDisclosedBeforePurchase() throws Exception {
        JsonNode body = mapper.readTree(get("/api/v1/templates/film-camera-portrait"));

        assertThat(body.path("promptAccess").asText()).isEqualTo("PAID");
        assertThat(body.path("promptCost").asInt()).isEqualTo(100);
        assertThat(body.path("prompt").isNull() || body.path("prompt").isMissingNode())
                .as("구매 전에는 원문이 내려가면 안 된다")
                .isTrue();
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
