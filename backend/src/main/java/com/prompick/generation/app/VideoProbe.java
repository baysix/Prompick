package com.prompick.generation.app;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 영상 길이를 파일에서 직접 잰다.
 *
 * <p>왜 서버가 재느냐. 이 서비스에서 영상 제작의 요금은 결과가 아니라 <b>입력 영상의 길이</b>에
 * 비례한다. 길이를 브라우저가 알려주게 두면, 그 숫자 하나를 고치는 것만으로 30초짜리를 5초로
 * 신고하고 우리 계정에서 2만원이 나가게 만들 수 있다.
 *
 * <p>파일 전체를 내려받지 않는다. 앞뒤 조각만 Range 로 가져와 mp4 의 {@code mvhd} 상자를 읽는다.
 * 영상은 수십 MB 라 통째로 들면 컨테이너가 죽는다.
 *
 * <p>mp4·mov 만 읽는다. 읽지 못하면 통과시키지 않고 막는다 — 길이를 모르는 채로 보내면 얼마가
 * 나갈지 모르는 호출이 된다. 모르면 거절하는 쪽이 옳다.
 */
public final class VideoProbe {

    private static final Logger log = LoggerFactory.getLogger(VideoProbe.class);

    /** 앞뒤로 훑어볼 크기. moov 상자는 보통 맨 앞이나 맨 뒤에 있다 */
    private static final int WINDOW = 2 * 1024 * 1024;

    private static final Duration TIMEOUT = Duration.ofSeconds(20);

    private VideoProbe() {}

    /**
     * 길이를 초 단위로 잰다.
     *
     * @param url 읽을 수 있는 주소 (서명된 내려받기 주소)
     * @return 재지 못하면 비어 있음
     */
    public static Optional<Double> durationSeconds(String url) {
        // 앞부터 본다. 웹 재생을 염두에 두고 만든 파일은 moov 가 앞에 있다.
        Optional<Double> head = readRange(url, 0, WINDOW - 1).flatMap(VideoProbe::parseMvhd);
        if (head.isPresent()) {
            return head;
        }

        // 아니면 끝에 있다. 편집기가 그냥 내보낸 파일이 대개 이렇다.
        long size = contentLength(url);
        if (size <= 0) {
            return Optional.empty();
        }
        long from = Math.max(0, size - WINDOW);
        return readRange(url, from, size - 1).flatMap(VideoProbe::parseMvhd);
    }

    /**
     * mvhd 상자에서 길이를 꺼낸다.
     *
     * <p>구조는 이렇다 — 4바이트 크기, 4바이트 이름("mvhd"), 1바이트 버전, 3바이트 플래그,
     * 그다음 버전 0 이면 (생성 4, 수정 4, 시간단위 4, 길이 4), 버전 1 이면 (8, 8, 4, 8).
     * 길이를 시간단위로 나누면 초가 된다.
     */
    private static Optional<Double> parseMvhd(byte[] data) {
        for (int i = 0; i + 32 < data.length; i++) {
            if (data[i] != 'm'
                    || data[i + 1] != 'v'
                    || data[i + 2] != 'h'
                    || data[i + 3] != 'd') {
                continue;
            }

            int p = i + 4;
            int version = data[p] & 0xFF;
            p += 4; // 버전 1 + 플래그 3

            try {
                long timescale;
                long duration;

                if (version == 1) {
                    p += 16; // 생성 8 + 수정 8
                    timescale = readUInt32(data, p);
                    p += 4;
                    duration = readUInt64(data, p);
                } else {
                    p += 8; // 생성 4 + 수정 4
                    timescale = readUInt32(data, p);
                    p += 4;
                    duration = readUInt32(data, p);
                }

                if (timescale <= 0 || duration <= 0) {
                    continue;
                }
                double seconds = (double) duration / timescale;

                // 말이 되는 범위인지 본다. 엉뚱한 자리에서 "mvhd" 네 글자를 만났을 수 있다.
                if (seconds > 0.1 && seconds < 60 * 60 * 12) {
                    return Optional.of(seconds);
                }
            } catch (RuntimeException e) {
                // 이 자리는 mvhd 가 아니었다. 계속 찾는다.
            }
        }
        return Optional.empty();
    }

    private static Optional<byte[]> readRange(String url, long from, long to) {
        try {
            HttpResponse<InputStream> response =
                    client().send(
                                    HttpRequest.newBuilder(URI.create(url))
                                            .timeout(TIMEOUT)
                                            .header("Range", "bytes=" + from + "-" + to)
                                            .GET()
                                            .build(),
                                    HttpResponse.BodyHandlers.ofInputStream());

            if (response.statusCode() / 100 != 2) {
                response.body().close();
                return Optional.empty();
            }
            try (InputStream in = response.body()) {
                return Optional.of(in.readNBytes(WINDOW));
            }
        } catch (IOException e) {
            log.debug("영상 앞뒤를 읽지 못했다: {}", e.toString());
            return Optional.empty();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return Optional.empty();
        }
    }

    private static long contentLength(String url) {
        try {
            HttpResponse<Void> response =
                    client().send(
                                    HttpRequest.newBuilder(URI.create(url))
                                            .timeout(TIMEOUT)
                                            .method("HEAD", HttpRequest.BodyPublishers.noBody())
                                            .build(),
                                    HttpResponse.BodyHandlers.discarding());
            return response.headers().firstValueAsLong("content-length").orElse(-1);
        } catch (IOException e) {
            return -1;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return -1;
        }
    }

    private static HttpClient client() {
        return HttpClient.newBuilder()
                .connectTimeout(TIMEOUT)
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    private static long readUInt32(byte[] d, int p) {
        return ((long) (d[p] & 0xFF) << 24)
                | ((long) (d[p + 1] & 0xFF) << 16)
                | ((long) (d[p + 2] & 0xFF) << 8)
                | (d[p + 3] & 0xFF);
    }

    private static long readUInt64(byte[] d, int p) {
        long value = 0;
        for (int i = 0; i < 8; i++) {
            value = (value << 8) | (d[p + i] & 0xFF);
        }
        return value;
    }
}
