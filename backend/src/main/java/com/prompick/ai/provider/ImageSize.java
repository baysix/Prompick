package com.prompick.ai.provider;

/**
 * 비율을 실제 픽셀 크기로 바꾼다.
 *
 * <p>운영자는 "9:16"만 고르면 된다. {@code 864x1536}이 9:16이라는 것을 외우게 할 이유가 없고,
 * 외우게 하면 언젠가 틀린다. 실제로 흔히 쓰는 {@code 1080x1920}을 넣었다가 거절당한 적이 있다 —
 * 1080이 16으로 나눠떨어지지 않기 때문인데, 이런 것은 사람이 기억할 일이 아니다.
 *
 * <p>긴 변을 1536으로 두고 짧은 변을 비율에서 구한 뒤, 둘 다 16의 배수가 되도록 맞춘다.
 * 1536을 고른 이유는 지금까지 쓰던 크기이고, 격자 형태의 템플릿에서도 칸마다 화소가 남기
 * 때문이다. 더 키우면 요금이 그만큼 오른다.
 */
public final class ImageSize {

    /** 긴 변의 길이 */
    private static final int LONG_EDGE = 1536;

    /** 제공사가 요구하는 배수 */
    private static final int MULTIPLE = 16;

    private ImageSize() {}

    /**
     * 파이프라인에 적힌 값을 제공사에 보낼 크기로 바꾼다.
     *
     * @param value {@code "9:16"} 같은 비율, 또는 {@code "1024x1536"} 같은 픽셀 크기
     * @return 픽셀 크기. 알아볼 수 없으면 null이고, 그때는 제공사 기본값에 맡긴다
     */
    public static String resolve(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();

        // 픽셀로 직접 적었으면 그대로 쓴다. 특별한 크기가 필요한 경우를 막지 않는다.
        if (trimmed.matches("\\d+x\\d+")) {
            return trimmed;
        }
        if (!trimmed.matches("\\d+\\s*:\\s*\\d+")) {
            return null;
        }

        String[] parts = trimmed.split(":");
        int w = Integer.parseInt(parts[0].trim());
        int h = Integer.parseInt(parts[1].trim());
        if (w <= 0 || h <= 0) {
            return null;
        }

        int width;
        int height;
        if (w >= h) {
            width = LONG_EDGE;
            height = snap(LONG_EDGE * h / (double) w);
        } else {
            height = LONG_EDGE;
            width = snap(LONG_EDGE * w / (double) h);
        }
        return width + "x" + height;
    }

    /** 16의 배수로 맞춘다. 가장 가까운 쪽으로 붙이되 0이 되지 않게 한다 */
    private static int snap(double value) {
        int rounded = (int) Math.round(value / MULTIPLE) * MULTIPLE;
        return Math.max(MULTIPLE, rounded);
    }
}
