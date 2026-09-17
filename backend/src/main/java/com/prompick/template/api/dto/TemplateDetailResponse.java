package com.prompick.template.api.dto;

import com.prompick.template.domain.ContentType;
import com.prompick.template.domain.GenerateAccess;
import com.prompick.template.domain.PromptAccess;
import java.util.List;
import java.util.Map;

/**
 * 템플릿 상세. 사용자용.
 *
 * <p>프롬프트 원문({@code prompt})은 두 조건을 모두 만족할 때만 채워진다.
 *
 * <ul>
 *   <li>{@code promptAccess}가 HIDDEN이 아니다
 *   <li>PAID라면 사용자가 열람권을 구매했다 (5단계에서 연결)
 * </ul>
 *
 * 그 외에는 {@code null}이며, 화면은 잠긴 표면을 보여준다.
 */
public record TemplateDetailResponse(
        String slug,
        String title,
        String description,
        ContentType contentType,
        String categoryName,
        String categorySlug,
        List<String> tags,
        List<MediaResponse> media,
        OutputSpecResponse output,
        int estimatedSeconds,
        String requiredPhotoSummary,
        Map<String, Object> uploadGuide,
        List<InputFieldResponse> inputFields,
        PromptAccess promptAccess,
        int promptCost,
        GenerateAccess generateAccess,
        int generateCost,
        /** 공개 조건을 만족할 때만 채워진다 */
        PublicPromptResponse prompt,
        long generationCount,
        long favoriteCount) {

    public record MediaResponse(
            ContentType mediaType, String url, String previewUrl, String thumbnailUrl) {}

    public record OutputSpecResponse(Integer durationSeconds, String resolution, String ratio) {}

    public record InputFieldResponse(
            String fieldKey,
            String fieldType,
            String label,
            String helpText,
            boolean required,
            List<Map<String, Object>> options,
            Map<String, Object> validation) {}

    /** 공개용 프롬프트 원문. 실행용 파이프라인이 아니다. */
    public record PublicPromptResponse(
            String body, String negativePrompt, String recommendedTool, String usageTip) {}
}
