package com.prompick.generation.app;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 프롬프트 안에서 사진을 가리키는 표시를 푼다.
 *
 * <p>운영자는 프롬프트에 {@code @대표사진} 처럼 적고, 그 이름에 어떤 입력 칸을 이을지만 고른다.
 * 연결이 프롬프트 밖에 따로 있으면 프롬프트를 고치다 이름이 바뀌었을 때 연결이 조용히 끊긴다.
 * 표시를 글 안에 두면 무엇이 필요한지가 글을 읽는 것만으로 드러난다.
 *
 * <p>모델에게는 {@code @대표사진} 이라는 말이 아무 의미가 없다. 그래서 보내기 직전에 모델이
 * 알아듣는 말로 바꾼다 — 사진이 하나면 "첨부한 사진", 여럿이면 "첫 번째 사진", "두 번째 사진".
 * 그리고 사진을 그 순서대로 싣는다. 글에서 부르는 차례와 실제로 실리는 차례가 같아야
 * 모델이 어느 사진을 말하는지 안다.
 *
 * <h2>조건줄</h2>
 *
 * <p>사진 칸을 여러 개 두고 그중 일부만 올려도 되게 하려면, 올리지 않은 것을 말하는 문장이
 * 사라져야 한다. 영상을 다시 짓는 모델에서 특히 그렇다 — "학생들을 이 사람들로 바꿔라"는
 * 문장이 사진 없이 남으면, 모델은 있지도 않은 사진을 찾다가 엉뚱한 것을 지어낸다.
 *
 * <p>그래서 줄 앞에 표를 둘 수 있다.
 *
 * <pre>
 * ?@학생들 Replace every student with people resembling @학생들.
 * !@학생들 Keep the students exactly as filmed.
 * </pre>
 *
 * <p>{@code ?} 는 그 사진이 올라왔을 때만, {@code !} 는 올라오지 않았을 때만 남긴다. 표가 없는
 * 줄은 언제나 남는다. 문법을 이 이상 늘리지 않는다 — 중첩이나 조건식이 들어가는 순간 프롬프트가
 * 글이 아니라 코드가 되고, 그러면 아무도 읽지 않게 된다.
 */
public final class PhotoReferences {

    /** 프롬프트 안의 사진 표시. 한글 이름을 쓸 수 있어야 한다 */
    private static final Pattern TOKEN = Pattern.compile("@([가-힣A-Za-z0-9_]+)");

    private static final String[] ORDINALS = {
        "첫 번째", "두 번째", "세 번째", "네 번째", "다섯 번째", "여섯 번째", "일곱 번째", "여덟 번째"
    };

    private PhotoReferences() {}

    /**
     * 프롬프트의 표시를 모델이 읽을 말로 바꾸고, 사진을 부르는 차례대로 정렬한다.
     *
     * @param prompt 운영자가 적은 지시문
     * @param resolved 표시 이름 → 스토리지 키
     * @return 바뀐 지시문과, 글에 나온 차례대로 정렬한 사진들
     */
    static Resolved apply(String prompt, Map<String, String> resolved) {
        if (prompt == null || prompt.isBlank()) {
            return new Resolved(prompt == null ? "" : prompt, new LinkedHashMap<>(resolved));
        }

        // 조건줄을 먼저 걸러낸다. 사라질 줄에 있던 이름이 사진 차례를 차지하면 안 된다.
        prompt = applyConditionalLines(prompt, resolved.keySet());

        // 글에 나온 차례대로 이름을 모은다. 같은 이름을 여러 번 불러도 한 번만 센다.
        List<String> order = new ArrayList<>();
        Matcher scan = TOKEN.matcher(prompt);
        while (scan.find()) {
            String name = "@" + scan.group(1);
            if (resolved.containsKey(name) && !order.contains(name)) {
                order.add(name);
            }
        }

        // 글에서 부르지 않았지만 연결된 사진도 뒤에 붙인다. 운영자가 표시를 빠뜨렸을 뿐
        // 사진은 보내달라는 뜻일 수 있고, 버리는 것보다 낫다.
        resolved.keySet().stream().filter(name -> !order.contains(name)).forEach(order::add);

        Map<String, String> files = new LinkedHashMap<>();
        order.forEach(name -> files.put(name, resolved.get(name)));

        return new Resolved(rewrite(prompt, order), files);
    }

    /** 줄 앞의 {@code ?@이름} / {@code !@이름} 표를 보고 남길 줄을 고른다 */
    private static final Pattern CONDITION =
            Pattern.compile("^\\s*([?!])@([가-힣A-Za-z0-9_]+)\\s*");

    private static String applyConditionalLines(String prompt, java.util.Set<String> present) {
        StringBuilder out = new StringBuilder();

        for (String line : prompt.split("\n", -1)) {
            Matcher marker = CONDITION.matcher(line);

            if (!marker.find()) {
                out.append(line).append('\n');
                continue;
            }

            boolean wantPresent = "?".equals(marker.group(1));
            boolean uploaded = present.contains("@" + marker.group(2));

            if (wantPresent == uploaded) {
                // 표만 떼고 내용은 남긴다.
                out.append(line.substring(marker.end())).append('\n');
            }
        }

        // 조건줄이 빠지면서 생긴 빈 줄이 여러 개 겹치면 문단 구분이 흐려진다.
        return out.toString().replaceAll("\n{3,}", "\n\n").strip();
    }

    /** {@code @이름}을 "첫 번째 사진" 같은 말로 바꾼다 */
    private static String rewrite(String prompt, List<String> order) {
        Matcher matcher = TOKEN.matcher(prompt);
        StringBuilder out = new StringBuilder();

        while (matcher.find()) {
            String name = "@" + matcher.group(1);
            int index = order.indexOf(name);

            // 연결되지 않은 표시는 그대로 둔다. 지워버리면 운영자가 오타를 알아챌 길이 없다.
            String replacement = index < 0 ? name : label(index, order.size());
            matcher.appendReplacement(out, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(out);
        return out.toString();
    }

    private static String label(int index, int total) {
        if (total <= 1) {
            return "첨부한 사진";
        }
        return (index < ORDINALS.length ? ORDINALS[index] : (index + 1) + "번째") + " 사진";
    }

    /**
     * 사용자에게 보여줄 모양으로 다듬는다.
     *
     * <p>조건줄({@code ?@}/{@code !@})만 정리하고 {@code @이름} 은 그대로 둔다.
     *
     * <p>토큰을 "첨부한 사진"으로 바꾸지 않는 이유가 있다. 그 말은 이름을 잃어버린다 —
     * {@code @아기사진} 은 어떤 사진이 왜 필요한지를 그 자리에서 알려주는데, "첨부한 사진"은
     * 그냥 사진이 하나 들어간다는 말일 뿐이다. 받아 가서 다른 AI 에 쓰는 사람에게도 어디에
     * 무엇을 넣어야 하는지가 보이는 편이 낫다.
     *
     * <p>조건줄은 사진을 모두 올린 경우로 친다. 그러지 않으면 "그대로 둔다"는 문장만 남아
     * 아무것도 하지 않는 지시문으로 읽히고, 바꾸는 문장과 그대로 두는 문장이 함께 남으면
     * 서로 모순된 글이 된다.
     */
    public static String forDisplay(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            return "";
        }
        return applyConditionalLines(prompt, new java.util.LinkedHashSet<>(tokensIn(prompt)));
    }

    /** 이름이 몇 개나 쓰였는지. 관리자 화면이 연결 칸을 그릴 때 쓴다 */
    public static List<String> tokensIn(String prompt) {
        List<String> names = new ArrayList<>();
        if (prompt == null) {
            return names;
        }
        Matcher matcher = TOKEN.matcher(prompt);
        while (matcher.find()) {
            String name = "@" + matcher.group(1);
            if (!names.contains(name)) {
                names.add(name);
            }
        }
        return names;
    }

    record Resolved(String prompt, Map<String, String> files) {}
}
