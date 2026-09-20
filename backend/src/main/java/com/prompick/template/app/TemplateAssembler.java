package com.prompick.template.app;

import com.prompick.storage.StorageService;
import com.prompick.template.api.dto.TemplateCardResponse;
import com.prompick.template.api.dto.TemplateDetailResponse;
import com.prompick.template.domain.Template;
import com.prompick.template.domain.TemplateInputField;
import com.prompick.template.domain.TemplateMedia;
import com.prompick.template.domain.TemplatePublicPrompt;
import java.util.List;
import org.springframework.stereotype.Component;

/**
 * 엔티티를 사용자용 응답으로 바꾼다.
 *
 * <p>엔티티를 그대로 직렬화하지 않는 이유가 여기 있다. 이 클래스를 거치지 않으면 응답이 만들어지지 않으므로,
 * 노출 판단이 한 곳에 모인다.
 */
@Component
public class TemplateAssembler {

    private final StorageService storage;

    public TemplateAssembler(StorageService storage) {
        this.storage = storage;
    }

    public TemplateCardResponse toCard(Template t) {
        TemplateMedia media = t.primaryMedia();
        return new TemplateCardResponse(
                t.getSlug(),
                t.getTitle(),
                t.getContentType(),
                categoryNameOf(t),
                media == null ? null : url(media.getPreviewKey()),
                media == null ? null : url(media.getThumbnailKey()),
                t.getRequiredPhotoSummary(),
                t.getRatio(),
                media == null ? null : media.aspectRatio(),
                t.getPromptAccess(),
                t.getPromptCost(),
                t.getGenerateAccess(),
                t.getGenerateCost(),
                t.getGenerationCount());
    }

    public List<TemplateCardResponse> toCards(List<Template> templates) {
        return templates.stream().map(this::toCard).toList();
    }

    /**
     * 상세 응답.
     *
     * @param prompt 공개 조건을 만족할 때만 넘긴다. 그 판단은 호출하는 쪽(서비스)이 한다.
     */
    public TemplateDetailResponse toDetail(Template t, TemplatePublicPrompt prompt) {
        return new TemplateDetailResponse(
                t.getSlug(),
                t.getTitle(),
                t.getDescription(),
                t.getContentType(),
                categoryNameOf(t),
                // 분류는 선택값이다. 없는 템플릿이 정상이므로 빈 문자열로 내려보낸다
                t.getCategory() == null ? "" : t.getCategory().getSlug(),
                List.copyOf(t.getTags()),
                t.getMedia().stream()
                        .map(m -> new TemplateDetailResponse.MediaResponse(
                                m.getMediaType(),
                                url(m.getStorageKey()),
                                url(m.getPreviewKey()),
                                url(m.getThumbnailKey())))
                        .toList(),
                new TemplateDetailResponse.OutputSpecResponse(
                        t.getDurationSeconds(), t.getResolution(), t.getRatio()),
                t.getEstimatedSeconds(),
                t.getRequiredPhotoSummary(),
                t.getUploadGuide(),
                t.getInputFields().stream().map(this::toInputField).toList(),
                t.getPromptAccess(),
                t.getPromptCost(),
                t.getGenerateAccess(),
                t.getGenerateCost(),
                prompt == null
                        ? null
                        : new TemplateDetailResponse.PublicPromptResponse(
                                prompt.getBody(),
                                prompt.getNegativePrompt(),
                                prompt.getRecommendedTool(),
                                prompt.getUsageTip()),
                t.getGenerationCount(),
                t.getFavoriteCount());
    }

    private TemplateDetailResponse.InputFieldResponse toInputField(TemplateInputField f) {
        return new TemplateDetailResponse.InputFieldResponse(
                f.getFieldKey(),
                f.getFieldType().name(),
                f.getLabel(),
                f.getHelpText(),
                f.isRequired(),
                f.getOptions(),
                f.getValidation());
    }

    /** 주제 묶음은 선택 항목이다. 없으면 콘텐츠 타입으로 대신한다. */
    private static String categoryNameOf(Template t) {
        if (t.getCategory() != null) {
            return t.getCategory().getName();
        }
        return t.getContentType() == com.prompick.template.domain.ContentType.VIDEO ? "영상" : "이미지";
    }

    /** 템플릿 예시는 공개 버킷에 있다. 서명하지 않으므로 목록을 그릴 때 네트워크 호출이 없다. */
    private String url(String storageKey) {
        return storageKey == null ? null : storage.publicUrl(storageKey);
    }
}
