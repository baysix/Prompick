package com.prompick.storage;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.config.PrompickProperties;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Duration;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * 개발용 로컬 디스크 저장소.
 *
 * <p>MinIO나 Docker 없이도 업로드·다운로드 흐름을 끝까지 돌려볼 수 있게 한다. 운영에서는 S3 구현으로 교체한다.
 */
@Component
@ConditionalOnProperty(name = "prompick.storage.type", havingValue = "LOCAL")
public class LocalFileStorage implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalFileStorage.class);

    private final Path basePath;
    private final String publicBaseUrl;

    public LocalFileStorage(PrompickProperties properties) {
        this.basePath = Path.of(properties.storage().local().basePath()).toAbsolutePath().normalize();
        this.publicBaseUrl = trimTrailingSlash(properties.storage().local().publicBaseUrl());
        try {
            Files.createDirectories(basePath);
        } catch (IOException e) {
            throw new IllegalStateException("로컬 저장소 디렉터리를 만들지 못했습니다: " + basePath, e);
        }
        log.info("LocalFileStorage 사용. 저장 경로: {}", basePath);
    }

    @Override
    public PresignedUpload presignUpload(String storageKey, String contentType, Duration ttl) {
        // 로컬에서는 서명 대신 우리 서버의 업로드 엔드포인트를 그대로 쓴다.
        String url = publicBaseUrl + "/" + encodeKey(storageKey);
        return new PresignedUpload(url, "PUT", Map.of("Content-Type", contentType));
    }

    @Override
    public String presignDownload(String storageKey, Duration ttl) {
        return publicBaseUrl + "/" + encodeKey(storageKey);
    }

    @Override
    public String publicUrl(String storageKey) {
        return publicBaseUrl + "/" + encodeKey(storageKey);
    }

    @Override
    public void put(String storageKey, InputStream content, String contentType, long contentLength) {
        Path target = resolve(storageKey);
        try {
            Files.createDirectories(target.getParent());
            Files.copy(content, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, e);
        }
    }

    @Override
    public InputStream get(String storageKey) {
        try {
            return Files.newInputStream(resolve(storageKey));
        } catch (IOException e) {
            throw new ApiException(ErrorCode.NOT_FOUND, e);
        }
    }

    @Override
    public boolean exists(String storageKey) {
        return Files.exists(resolve(storageKey));
    }

    @Override
    public void delete(String storageKey) {
        try {
            Files.deleteIfExists(resolve(storageKey));
        } catch (IOException e) {
            log.warn("파일 삭제 실패: {}", storageKey, e);
        }
    }

    /** 경로 탈출(../)을 막고 basePath 안으로만 해석한다. */
    private Path resolve(String storageKey) {
        Path resolved = basePath.resolve(storageKey).normalize();
        if (!resolved.startsWith(basePath)) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }
        return resolved;
    }

    private static String encodeKey(String storageKey) {
        StringBuilder sb = new StringBuilder();
        String[] segments = storageKey.split("/");
        for (int i = 0; i < segments.length; i++) {
            if (i > 0) {
                sb.append('/');
            }
            sb.append(URLEncoder.encode(segments[i], StandardCharsets.UTF_8));
        }
        return sb.toString();
    }

    private static String trimTrailingSlash(String url) {
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
