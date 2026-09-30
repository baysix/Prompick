package com.prompick.admin.api;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.storage.StorageService;
import com.prompick.template.domain.Template;
import com.prompick.template.domain.TemplateRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.time.Duration;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * 레퍼런스 영상. 관리자 전용.
 *
 * <p>영상을 다시 짓는 템플릿의 재료다. 예시 결과물과 다른 자리에 두는 이유는 정반대의 것이기
 * 때문이다 — 예시는 이 템플릿이 만들어내는 것이고, 레퍼런스는 만들 때 쓰는 것이다.
 *
 * <p>업로드 주소 발급은 예시 쪽({@code /media/presign})을 그대로 쓴다. 올리는 방법은 같고 어디에
 * 연결하느냐만 다르다.
 */
@RestController
@RequestMapping("/api/v1/admin/templates/{templateId}/reference-video")
@Tag(name = "관리자 - 레퍼런스 영상")
public class AdminReferenceVideoController {

    private final TemplateRepository templates;
    private final StorageService storage;

    public AdminReferenceVideoController(TemplateRepository templates, StorageService storage) {
        this.templates = templates;
        this.storage = storage;
    }

    @GetMapping
    @Operation(summary = "지금 걸린 레퍼런스 영상")
    @Transactional(readOnly = true)
    public ReferenceVideoResponse get(@PathVariable Long templateId) {
        return toResponse(find(templateId));
    }

    @PutMapping
    @Operation(
            summary = "레퍼런스 영상 연결",
            description = "원본은 제작에 쓰이고, 미리보기는 목록에서 자동재생한다")
    @Transactional
    public ReferenceVideoResponse put(
            @PathVariable Long templateId, @Valid @RequestBody SaveRequest request) {

        Template template = find(templateId);

        if (!storage.exists(request.videoKey())) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "업로드가 끝나지 않았어요.");
        }

        template.setReferenceVideo(
                request.videoKey(),
                // 미리보기를 안 주면 원본이 목록에서 돈다. 막지 않되 화면에서 경고한다.
                blankToNull(request.previewKey()),
                blankToNull(request.posterKey()));

        return toResponse(template);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "레퍼런스 영상 떼기", description = "파일 자체는 저장소에 남는다")
    @Transactional
    public void delete(@PathVariable Long templateId) {
        find(templateId).setReferenceVideo(null, null, null);
    }

    private Template find(Long id) {
        return templates.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
    }

    private ReferenceVideoResponse toResponse(Template t) {
        return new ReferenceVideoResponse(
                t.getReferenceVideoKey(),
                t.getReferencePreviewKey(),
                t.getReferencePosterKey(),
                url(t.getReferenceVideoKey()),
                url(t.getReferencePreviewKey()),
                url(t.getReferencePosterKey()));
    }

    /**
     * 화면에서 바로 볼 수 있는 주소.
     *
     * <p>공개 버킷이면 공개 주소를, 아니면 서명 주소를 준다. 관리자가 올린 파일이 어느 버킷에
     * 있든 확인은 할 수 있어야 한다.
     */
    private String url(String key) {
        if (key == null || key.isBlank()) {
            return null;
        }
        try {
            return storage.publicUrl(key);
        } catch (RuntimeException e) {
            return storage.presignDownload(key, Duration.ofMinutes(30));
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    public record SaveRequest(
            @NotBlank String videoKey, String previewKey, String posterKey) {}

    public record ReferenceVideoResponse(
            String videoKey,
            String previewKey,
            String posterKey,
            String videoUrl,
            String previewUrl,
            String posterUrl) {}
}
