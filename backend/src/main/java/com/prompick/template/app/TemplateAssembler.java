package com.prompick.template.app;

import com.prompick.storage.StorageService;
import com.prompick.template.api.dto.TemplateCardResponse;
import com.prompick.template.api.dto.TemplateDetailResponse;
import com.prompick.template.domain.ContentType;
import com.prompick.template.domain.Template;
import com.prompick.template.domain.TemplateInputField;
import com.prompick.template.domain.TemplateMedia;
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

    /**
     * 목록 카드.
     *
     * <p>예시 결과물이 있으면 그것을, 없으면 레퍼런스 영상을 보여준다. 영상 템플릿은 레퍼런스가
     * 곧 예시다 — "이 영상에 네 얼굴을 넣어준다"가 이 템플릿의 설명 전부라, 같은 영상을 예시로
     * 한 번 더 올리게 하는 것은 같은 일을 두 번 시키는 것이다.
     */
    public TemplateCardResponse toCard(Template t) {
        TemplateMedia media = t.primaryMedia();

        String previewUrl = media != null
                ? url(media.getPreviewKey())
                : url(firstOf(t.getReferencePreviewKey(), t.getReferenceVideoKey()));

        String thumbnailUrl = media != null
                ? url(media.getThumbnailKey())
                : url(t.getReferencePosterKey());

        return new TemplateCardResponse(
                t.getSlug(),
                t.getTitle(),
                t.getContentType(),
                categoryNameOf(t),
                previewUrl,
                thumbnailUrl,
                t.getRequiredPhotoSummary(),
                t.getRatio(),
                media == null ? null : media.aspectRatio(),
                t.getPromptAccess(),
                t.getPromptCost(),
                t.getGenerateAccess(),
                t.getGenerateCost(),
                t.getGenerationCount());
    }

    /**
     * 상세 화면에 보여줄 것들.
     *
     * <p>예시 결과물이 있으면 그것을, 없으면 레퍼런스 영상을 보여준다. 영상 템플릿은 레퍼런스가
     * 곧 예시라 예시 목록이 비어 있는 것이 정상이다.
     *
     * <p>레퍼런스를 보여줄 때도 원본이 아니라 미리보기를 건넨다. 상세 화면에서 자동재생되는데
     * 원본이 수십 MB 면 그 화면을 여는 것만으로 그만큼이 나간다.
     */
    private List<TemplateDetailResponse.MediaResponse> mediaOf(Template t) {
        if (!t.getMedia().isEmpty()) {
            return t.getMedia().stream()
                    .map(m -> new TemplateDetailResponse.MediaResponse(
                            m.getMediaType(),
                            url(m.getStorageKey()),
                            url(m.getPreviewKey()),
                            url(m.getThumbnailKey())))
                    .toList();
        }

        String reference = firstOf(t.getReferencePreviewKey(), t.getReferenceVideoKey());
        if (reference == null || reference.isBlank()) {
            return List.of();
        }

        return List.of(new TemplateDetailResponse.MediaResponse(
                ContentType.VIDEO,
                url(reference),
                url(reference),
                url(t.getReferencePosterKey())));
    }

    /** 앞의 것이 비어 있으면 뒤의 것을 쓴다 */
    private static String firstOf(String first, String second) {
        return first != null && !first.isBlank() ? first : second;
    }

    public List<TemplateCardResponse> toCards(List<Template> templates) {
        return templates.stream().map(this::toCard).toList();
    }

    /**
     * 상세 응답.
     *
     * @param prompt 사용자에게 보여줄 지시문. 공개 조건을 만족할 때만 넘긴다 — 그 판단과
     *     다듬는 일은 호출하는 쪽(서비스)이 한다.
     */
    public TemplateDetailResponse toDetail(Template t, String prompt) {
        return new TemplateDetailResponse(
                t.getSlug(),
                t.getTitle(),
                t.getDescription(),
                t.getContentType(),
                categoryNameOf(t),
                // 분류는 선택값이다. 없는 템플릿이 정상이므로 빈 문자열로 내려보낸다
                t.getCategory() == null ? "" : t.getCategory().getSlug(),
                List.copyOf(t.getTags()),
                mediaOf(t),
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
                prompt == null || prompt.isBlank()
                        ? null
                        // 곁가지 칸(제외할 것·추천 도구·사용 팁)은 쓰이지 않아 없앴다.
                        // 18개 템플릿에서 앞의 둘은 0건, 사용 팁은 1건이었다.
                        : new TemplateDetailResponse.PublicPromptResponse(prompt, null, null, null),
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
