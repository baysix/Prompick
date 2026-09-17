package com.prompick.admin.api.dto;

import com.prompick.template.domain.*;
import java.util.List;
import java.util.Map;

/**
 * 관리자용 템플릿 응답.
 *
 * <p>사용자용 {@code TemplateDetailResponse}와 클래스가 다르다. 관리자에게는 비공개 상태의
 * 템플릿과 공개 프롬프트 원문까지 보이지만, 파이프라인은 별도 엔드포인트로 분리해 둔다.
 */
public record AdminTemplateResponse(
        Long id,
        String slug,
        String title,
        String description,
        ContentType contentType,
        String categorySlug,
        String categoryName,
        TemplateStatus status,
        PromptAccess promptAccess,
        int promptCost,
        GenerateAccess generateAccess,
        int generateCost,
        String ratio,
        Integer durationSeconds,
        String resolution,
        int estimatedSeconds,
        String requiredPhotoSummary,
        Map<String, Object> uploadGuide,
        List<String> tags,
        boolean pinned,
        /** 공개 프롬프트 등록 여부. 제공하기로 해놓고 원문을 안 넣은 상태를 잡기 위해 */
        boolean hasPublicPrompt,
        /** 활성 파이프라인 등록 여부. 없으면 제작이 불가능하다 */
        boolean hasActivePipeline,
        int mediaCount,
        long generationCount) {

    public static AdminTemplateResponse of(
            Template t, boolean hasPublicPrompt, boolean hasActivePipeline) {
        return new AdminTemplateResponse(
                t.getId(),
                t.getSlug(),
                t.getTitle(),
                t.getDescription(),
                t.getContentType(),
                t.getCategory().getSlug(),
                t.getCategory().getName(),
                t.getStatus(),
                t.getPromptAccess(),
                t.getPromptCost(),
                t.getGenerateAccess(),
                t.getGenerateCost(),
                t.getRatio(),
                t.getDurationSeconds(),
                t.getResolution(),
                t.getEstimatedSeconds(),
                t.getRequiredPhotoSummary(),
                t.getUploadGuide(),
                List.copyOf(t.getTags()),
                t.isPinned(),
                hasPublicPrompt,
                hasActivePipeline,
                t.getMedia().size(),
                t.getGenerationCount());
    }
}
