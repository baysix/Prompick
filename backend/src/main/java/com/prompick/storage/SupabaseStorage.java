package com.prompick.storage;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.config.PrompickProperties;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/**
 * Supabase Storage 구현.
 *
 * <p>service_role 키로 호출하므로 RLS를 우회한다. 이 키는 서버 밖으로 나가면 안 된다.
 * 사용자에게는 항상 짧은 만료의 서명 URL만 발급한다.
 *
 * <p>Supabase의 응답 본문은 사용자에게 그대로 전달하지 않고 {@link ErrorCode}로 변환한다.
 */
@Component
@ConditionalOnProperty(name = "prompick.storage.type", havingValue = "SUPABASE", matchIfMissing = true)
public class SupabaseStorage implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(SupabaseStorage.class);

    private final RestClient client;
    private final String storageApiUrl;

    public SupabaseStorage(PrompickProperties properties) {
        PrompickProperties.Supabase supabase = properties.supabase();
        if (!supabase.isConfigured()) {
            throw new IllegalStateException(
                    "SUPABASE_URL 이 비어 있습니다. .env를 채우거나 prompick.storage.type=LOCAL 로 바꾸세요.");
        }
        this.storageApiUrl = supabase.storageApiUrl();
        this.client = RestClient.builder()
                .baseUrl(storageApiUrl)
                .defaultHeader("apikey", supabase.secretKey())
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + supabase.secretKey())
                .build();
        log.info("SupabaseStorage 사용. endpoint: {}", storageApiUrl);
    }

    @Override
    public PresignedUpload presignUpload(String storageKey, String contentType, Duration ttl) {
        // Supabase는 업로드용 서명 URL을 별도로 발급한다. 클라이언트는 이 URL로 PUT 한다.
        Map<?, ?> body = call(
                () -> client.post()
                        .uri(path("/object/upload/sign/", storageKey))
                        .retrieve()
                        .body(Map.class));

        Object signedPath = body == null ? null : body.get("url");
        if (signedPath == null) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR);
        }
        return new PresignedUpload(
                storageApiUrl + signedPath, "PUT", Map.of(HttpHeaders.CONTENT_TYPE, contentType));
    }

    @Override
    public String presignDownload(String storageKey, Duration ttl) {
        Map<?, ?> body = call(
                () -> client.post()
                        .uri(path("/object/sign/", storageKey))
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(Map.of("expiresIn", ttl.toSeconds()))
                        .retrieve()
                        .body(Map.class));

        Object signedPath = body == null ? null : body.get("signedURL");
        if (signedPath == null) {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }
        return storageApiUrl + signedPath;
    }

    @Override
    public String presignDownload(String storageKey, Duration ttl, String fileName) {
        String signed = presignDownload(storageKey, ttl);

        // download 파라미터를 붙이면 Supabase가 Content-Disposition: attachment 로 내려준다.
        // 그래야 브라우저가 새 탭에 띄우지 않고 파일로 저장한다.
        String separator = signed.contains("?") ? "&" : "?";
        return signed
                + separator
                + "download="
                + URLEncoder.encode(fileName, StandardCharsets.UTF_8);
    }

    @Override
    public String publicUrl(String storageKey) {
        return storageApiUrl + "/object/public/" + encodeKey(storageKey);
    }

    @Override
    public void put(String storageKey, InputStream content, String contentType, long contentLength) {
        call(() -> client.post()
                .uri(path("/object/", storageKey))
                .contentType(MediaType.parseMediaType(contentType))
                .header("x-upsert", "true")
                .body(new InputStreamResource(content) {
                    @Override
                    public long contentLength() {
                        return contentLength;
                    }
                })
                .retrieve()
                .body(String.class));
    }

    @Override
    public InputStream get(String storageKey) {
        byte[] bytes = call(() ->
                client.get().uri(path("/object/", storageKey)).retrieve().body(byte[].class));
        if (bytes == null) {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }
        return new ByteArrayInputStream(bytes);
    }

    @Override
    public boolean exists(String storageKey) {
        try {
            // 1바이트만 요청해 존재 여부만 확인한다.
            client.get()
                    .uri(path("/object/", storageKey))
                    .header(HttpHeaders.RANGE, "bytes=0-0")
                    .retrieve()
                    .toBodilessEntity();
            return true;
        } catch (RestClientException e) {
            return false;
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            client.delete().uri(path("/object/", storageKey)).retrieve().toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("파일 삭제 실패: {}", storageKey);
        }
    }

    /**
     * storageKey를 경로로 만든다.
     *
     * <p>키에는 슬래시가 들어 있다(버킷/폴더/파일). URI 템플릿 변수로 넘기면 슬래시가 %2F로
     * 인코딩되어 버킷 이름이 통째로 깨진다. 그래서 세그먼트별로 직접 인코딩해 URI를 만든다.
     */
    private URI path(String prefix, String storageKey) {
        return URI.create(storageApiUrl + prefix + encodeKey(storageKey));
    }

    private static String encodeKey(String storageKey) {
        StringBuilder sb = new StringBuilder();
        String[] segments = storageKey.split("/");
        for (int i = 0; i < segments.length; i++) {
            if (i > 0) {
                sb.append('/');
            }
            sb.append(URLEncoder.encode(segments[i], StandardCharsets.UTF_8).replace("+", "%20"));
        }
        return sb.toString();
    }

    /** Supabase 호출을 감싸 예외 원문이 사용자에게 새지 않게 한다. */
    private <T> T call(java.util.function.Supplier<T> action) {
        try {
            return action.get();
        } catch (RestClientException e) {
            log.error("Supabase Storage 호출 실패", e);
            throw new ApiException(ErrorCode.INTERNAL_ERROR, e);
        }
    }
}
