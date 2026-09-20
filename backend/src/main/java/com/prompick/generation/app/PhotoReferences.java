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
