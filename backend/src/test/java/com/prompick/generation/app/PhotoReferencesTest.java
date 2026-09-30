package com.prompick.generation.app;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 조건줄이 실제로 동작하는지 본다.
 *
 * <p>이 기능은 눈으로 읽어서는 맞는지 알기 어렵다. 그리고 틀렸을 때의 대가가 크다 — 사라져야 할
 * 문장이 남으면 모델이 있지도 않은 사진을 찾고, 남아야 할 문장이 사라지면 사용자가 올린 사진이
 * 조용히 무시된다. 둘 다 오류 없이 잘못된 결과만 나온다.
 */
class PhotoReferencesTest {

    private static final String PROMPT =
            """
            Rebuild this video.
            ?@주인공 Replace the lead performer with the person in @주인공.
            !@주인공 Keep the lead performer exactly as filmed.
            ?@학생들 Replace the students with people resembling @학생들.
            !@학생들 Keep the students exactly as filmed.
            Keep the choreography and camera work unchanged.
            """;

    @Test
    @DisplayName("올린 사진의 줄만 남고, 올리지 않은 칸은 '그대로 둔다'로 바뀐다")
    void keepsOnlyTheLinesThatMatchWhatWasUploaded() {
        Map<String, String> uploaded = new LinkedHashMap<>();
        uploaded.put("@주인공", "uploads/1/lead.jpg");

        PhotoReferences.Resolved result = PhotoReferences.apply(PROMPT, uploaded);

        assertThat(result.prompt())
                .contains("Replace the lead performer")
                .contains("Keep the students exactly as filmed")
                .doesNotContain("Replace the students")
                .doesNotContain("Keep the lead performer exactly as filmed");

        // 표시가 글자로 남으면 모델이 읽을 쓰레기가 된다.
        assertThat(result.prompt()).doesNotContain("@주인공").doesNotContain("@학생들");
    }

    @Test
    @DisplayName("둘 다 올리면 둘 다 바꾸는 문장만 남고, 사진 차례가 글의 차례와 같다")
    void ordersPhotosTheWayThePromptCallsThem() {
        Map<String, String> uploaded = new LinkedHashMap<>();
        uploaded.put("@학생들", "uploads/1/students.jpg");
        uploaded.put("@주인공", "uploads/1/lead.jpg");

        PhotoReferences.Resolved result = PhotoReferences.apply(PROMPT, uploaded);

        assertThat(result.prompt())
                .contains("첫 번째 사진")
                .contains("두 번째 사진")
                .doesNotContain("exactly as filmed. ");

        // 글에서 주인공을 먼저 부르므로 주인공이 첫 번째여야 한다.
        assertThat(result.files().keySet()).containsExactly("@주인공", "@학생들");
    }

    @Test
    @DisplayName("아무것도 올리지 않으면 바꾸라는 문장이 하나도 남지 않는다")
    void dropsEveryReplacementWhenNothingWasUploaded() {
        PhotoReferences.Resolved result = PhotoReferences.apply(PROMPT, new LinkedHashMap<>());

        assertThat(result.prompt())
                .doesNotContain("Replace")
                .contains("Keep the lead performer exactly as filmed")
                .contains("Keep the students exactly as filmed")
                .contains("Keep the choreography and camera work unchanged");
    }

    @Test
    @DisplayName("표 없는 줄은 언제나 남는다")
    void alwaysKeepsUnmarkedLines() {
        PhotoReferences.Resolved result = PhotoReferences.apply(PROMPT, new LinkedHashMap<>());
        assertThat(result.prompt()).startsWith("Rebuild this video.");
    }

    @Test
    @DisplayName("사용자에게 보여줄 때는 조건줄만 걷고 @이름은 그대로 둔다")
    void keepsTokensWhenShowingToUsers() {
        String shown = PhotoReferences.forDisplay(PROMPT);

        // 이름이 남아야 어떤 사진이 왜 필요한지 읽는 것만으로 알 수 있다.
        assertThat(shown).contains("@주인공").contains("@학생들");

        // 우리 문법은 남으면 안 된다.
        assertThat(shown).doesNotContain("?@").doesNotContain("!@");

        // 사진을 다 올린 경우로 친다. 모순된 두 문장이 함께 남으면 안 된다.
        assertThat(shown)
                .contains("Replace the lead performer")
                .contains("Replace the students")
                .doesNotContain("exactly as filmed");
    }
}
