package com.prompick.admin.api;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.config.PrompickProperties;
import com.prompick.storage.StorageService;
import com.prompick.template.domain.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * 예시 결과물 관리.
 *
 * <p>예시는 이 템플릿으로 직접 만든 것만 올린다. 인스타 등 외부 원본은 저장하지 않는다.
 * 검색 노출과 OG 이미지에 쓰이므로 공개 버킷에 둔다.
 */
@RestController
@RequestMapping("/api/v1/admin/templates/{templateId}/media")
@Tag(name = "관리자 - 예시 결과물")
public class AdminMediaController {

    private final TemplateMediaRepository media;
    private final TemplateRepository templates;
    private final StorageService storage;
    private final String publicBucket;

    public AdminMediaController(
            TemplateMediaRepository media,
            TemplateRepository templates,
            StorageService storage,
            PrompickProperties properties) {
        this.media = media;
        this.templates = templates;
        this.storage = storage;
        this.publicBucket = properties.supabase().storage().publicBucket();
    }

    @GetMapping
    @Operation(summary = "예시 목록")
    public List<MediaResponse> list(@PathVariable Long templateId) {
        return media.findByTemplateIdOrderBySortOrderAscIdAsc(templateId).stream()
                .map(m -> new MediaResponse(
                        m.getId(),
                        m.getMediaType(),
                        m.getStorageKey(),
                        storage.publicUrl(m.getStorageKey()),
                        m.getSortOrder()))
                .toList();
    }

    @PostMapping("/presign")
    @Operation(
            summary = "업로드 주소 발급",
            description = "발급받은 주소로 파일을 직접 올린 뒤, 돌려받은 storageKey로 등록한다")
    public PresignResponse presign(
            @PathVariable Long templateId, @Valid @RequestBody PresignRequest request) {
        Template template = templates
                .findById(templateId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        String extension = extensionOf(request.fileName());
        String key = "%s/templates/%s/%s%s"
                .formatted(publicBucket, template.getSlug(), UUID.randomUUID(), extension);

        StorageService.PresignedUpload upload =
                storage.presignUpload(key, request.contentType(), Duration.ofMinutes(10));

        return new PresignResponse(key, upload.url(), upload.method(), upload.headers());
    }

    @PostMapping
    @Operation(summary = "예시 등록", description = "업로드가 끝난 파일을 이 템플릿의 예시로 연결한다")
    @Transactional
    public MediaResponse register(
            @PathVariable Long templateId, @Valid @RequestBody RegisterRequest request) {
        Template template = templates
                .findById(templateId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        if (!storage.exists(request.storageKey())) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "업로드가 끝나지 않았어요.");
        }

        int nextOrder = media.findByTemplateIdOrderBySortOrderAscIdAsc(templateId).size();
        TemplateMedia saved = media.save(new TemplateMedia(
                templateId,
                template.getContentType(),
                request.storageKey(),
                request.previewKey(),
                // 미리보기가 따로 없으면 원본을 썸네일로 쓴다
                request.thumbnailKey() == null ? request.storageKey() : request.thumbnailKey(),
                nextOrder));

        return new MediaResponse(
                saved.getId(),
                saved.getMediaType(),
                saved.getStorageKey(),
                storage.publicUrl(saved.getStorageKey()),
                saved.getSortOrder());
    }

    @DeleteMapping("/{mediaId}")
    @Operation(summary = "예시 삭제")
    @Transactional
    public void delete(@PathVariable Long templateId, @PathVariable Long mediaId) {
        TemplateMedia found =
                media.findById(mediaId).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        storage.delete(found.getStorageKey());
        media.delete(found);
    }

    private static String extensionOf(String fileName) {
        int dot = fileName.lastIndexOf('.');
        return dot == -1 ? "" : fileName.substring(dot).toLowerCase();
    }

    public record PresignRequest(
            @NotBlank String fileName, @NotBlank String contentType) {}

    public record PresignResponse(
            String storageKey, String url, String method, java.util.Map<String, String> headers) {}

    public record RegisterRequest(
            @NotBlank String storageKey, String previewKey, String thumbnailKey) {}

    public record MediaResponse(
            Long id, ContentType mediaType, String storageKey, String url, int sortOrder) {}
}
