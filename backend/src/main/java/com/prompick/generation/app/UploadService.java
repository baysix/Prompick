package com.prompick.generation.app;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.config.PrompickProperties;
import com.prompick.generation.domain.UploadRepository;
import com.prompick.generation.domain.Upload;
import com.prompick.storage.StorageService;
import java.io.IOException;
import java.io.InputStream;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 사진 업로드와 자동 검사.
 *
 * <p>파일은 백엔드를 거치지 않는다. 발급한 주소로 브라우저가 스토리지에 직접 올리고, 끝난 뒤
 * 검사만 요청한다. 수십 MB 파일이 서버 메모리를 지나가지 않게 하려는 구조다.
 *
 * <p>검사를 하는 이유는 결과 품질 때문만이 아니다. 나쁜 사진으로 제작하면 실패하고, 실패하면
 * 프롬비를 돌려줘야 하는데 외부 AI 호출 비용은 이미 나간 뒤다. 그래서 돈이 나가기 전에 막는다.
 */
@Service
public class UploadService {

    private static final Logger log = LoggerFactory.getLogger(UploadService.class);

    /** 제작에 쓰이지 않은 업로드를 정리하기까지의 기간 */
    private static final Duration UPLOAD_RETENTION = Duration.ofDays(1);

    private final UploadRepository uploads;
    private final StorageService storage;
    private final PrompickProperties properties;

    public UploadService(
            UploadRepository uploads, StorageService storage, PrompickProperties properties) {
        this.uploads = uploads;
        this.storage = storage;
        this.properties = properties;
    }

    /** 업로드 주소를 발급한다. */
    @Transactional
    public PresignResult presign(Long userId, String fileName, String contentType) {
        List<String> allowed = properties.upload().allowedMimeTypes();
        if (contentType == null || !allowed.contains(contentType.toLowerCase())) {
            throw new ApiException(ErrorCode.UPLOAD_UNSUPPORTED_TYPE);
        }

        String key = "%s/%d/%s%s"
                .formatted(
                        properties.supabase().storage().uploadBucket(),
                        userId,
                        UUID.randomUUID(),
                        extensionOf(fileName));

        Upload upload = uploads.save(
                new Upload(userId, key, contentType, Instant.now().plus(UPLOAD_RETENTION)));

        StorageService.PresignedUpload presigned =
                storage.presignUpload(key, contentType, Duration.ofMinutes(10));

        return new PresignResult(
                upload.getId(), presigned.url(), presigned.method(), presigned.headers());
    }

    /**
     * 업로드가 끝난 뒤 검사한다.
     *
     * <p>지금 하는 검사는 형식·용량·크기다. 흐림이나 제품 인식 같은 검사는 비전 모델이 필요해
     * 나중에 붙인다. 검사 항목이 늘어도 판정 결과({@code PASSED} / {@code WARNED} / {@code BLOCKED})는
     * 그대로라 화면은 바뀌지 않는다.
     */
    @Transactional
    public CheckResult check(Long userId, Long uploadId, Integer minWidth, Integer minHeight) {
        Upload upload = uploads
                .findById(uploadId)
                .filter(u -> u.getUserId().equals(userId))
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        byte[] bytes;
        try (InputStream in = storage.get(upload.getStorageKey())) {
            bytes = in.readAllBytes();
        } catch (IOException | RuntimeException e) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "사진을 아직 다 올리지 못했어요.");
        }

        Map<String, Object> result = new HashMap<>();
        Upload.CheckStatus status = Upload.CheckStatus.PASSED;

        long maxBytes = properties.upload().maxSizeBytes();
        if (bytes.length > maxBytes) {
            status = Upload.CheckStatus.BLOCKED;
            result.put("size", "%dMB 이하 사진을 올려주세요".formatted(properties.upload().maxSizeMb()));
        }

        Integer width = null;
        Integer height = null;
        try {
            var image = ImageIO.read(new java.io.ByteArrayInputStream(bytes));
            if (image != null) {
                width = image.getWidth();
                height = image.getHeight();
            }
        } catch (IOException e) {
            log.debug("이미지 크기를 읽지 못했습니다: upload={}", uploadId);
        }

        // 크기를 읽지 못하는 형식(SVG 등)은 크기 검사를 건너뛴다.
        if (width != null && height != null) {
            boolean tooSmall =
                    (minWidth != null && width < minWidth) || (minHeight != null && height < minHeight);
            if (tooSmall) {
                status = Upload.CheckStatus.BLOCKED;
                result.put("resolution", "사진이 너무 작아요. 더 큰 사진을 올려주세요");
            }
        }

        upload.recordCheck(status, result, (long) bytes.length, width, height);
        return new CheckResult(upload.getId(), status, result);
    }

    /** 제작에 쓸 수 있는 업로드인지 확인하고 가져온다. */
    @Transactional(readOnly = true)
    public Upload requireUsable(Long userId, Long uploadId) {
        Upload upload = uploads
                .findById(uploadId)
                .filter(u -> u.getUserId().equals(userId))
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        if (!upload.isUsable()) {
            throw new ApiException(ErrorCode.UPLOAD_BLOCKED);
        }
        return upload;
    }

    private static String extensionOf(String fileName) {
        if (fileName == null) return "";
        int dot = fileName.lastIndexOf('.');
        return dot == -1 ? "" : fileName.substring(dot).toLowerCase();
    }

    public record PresignResult(
            Long uploadId, String url, String method, Map<String, String> headers) {}

    public record CheckResult(
            Long uploadId, Upload.CheckStatus status, Map<String, Object> messages) {}
}
