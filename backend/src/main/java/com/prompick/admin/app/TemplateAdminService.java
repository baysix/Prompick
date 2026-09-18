package com.prompick.admin.app;

import com.prompick.admin.api.dto.AdminTemplateResponse;
import com.prompick.admin.api.dto.TemplateForm;
import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.template.domain.*;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 템플릿 관리. 관리자 전용. */
@Service
@Transactional
public class TemplateAdminService {

    private final TemplateRepository templates;
    private final CategoryRepository categories;
    private final TemplatePublicPromptRepository prompts;
    private final TemplatePipelineRepository pipelines;

    public TemplateAdminService(
            TemplateRepository templates,
            CategoryRepository categories,
            TemplatePublicPromptRepository prompts,
            TemplatePipelineRepository pipelines) {
        this.templates = templates;
        this.categories = categories;
        this.prompts = prompts;
        this.pipelines = pipelines;
    }

    @Transactional(readOnly = true)
    public List<AdminTemplateResponse> list() {
        return templates.findAll().stream()
                .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminTemplateResponse get(Long id) {
        return toResponse(find(id));
    }

    public AdminTemplateResponse create(TemplateForm form) {
        if (templates.findPublishedBySlug(form.slug()).isPresent()) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "이미 쓰고 있는 주소예요.");
        }
        Category category = findCategory(form.categorySlug());

        Template template = new Template(form.slug(), form.title(), form.contentType(), category);
        apply(template, form, category);

        return toResponse(templates.save(template));
    }

    public AdminTemplateResponse update(Long id, TemplateForm form) {
        Template template = find(id);
        apply(template, form, findCategory(form.categorySlug()));
        return toResponse(template);
    }

    /**
     * 게시.
     *
     * <p>게시하기 전에 준비가 끝났는지 확인한다. 반쯤 만든 템플릿이 목록에 나가면 사용자가 실패를
     * 겪게 되는데, 그 비용은 환불과 신뢰 하락으로 돌아온다.
     */
    public AdminTemplateResponse publish(Long id) {
        Template template = find(id);

        if (template.getMedia().isEmpty()) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "예시 결과물을 먼저 등록해주세요.");
        }
        if (pipelines.findByTemplateIdAndActiveTrue(id).isEmpty()) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "활성 파이프라인이 없어요. 제작이 불가능해요.");
        }
        if (template.isPromptDisclosed() && prompts.findByTemplateId(id).isEmpty()) {
            throw new ApiException(
                    ErrorCode.INVALID_REQUEST, "프롬프트를 제공하기로 했는데 원문이 없어요.");
        }

        template.publish();
        return toResponse(template);
    }

    public AdminTemplateResponse unpublish(Long id) {
        Template template = find(id);
        template.unpublish();
        return toResponse(template);
    }

    private void apply(Template template, TemplateForm form, Category category) {
        template.update(
                form.title(),
                form.description(),
                form.contentType(),
                category,
                form.promptAccess(),
                form.promptCost(),
                form.generateAccess(),
                form.generateCost(),
                form.ratio(),
                form.durationSeconds(),
                form.resolution(),
                form.estimatedSeconds(),
                form.requiredPhotoSummary(),
                form.uploadGuide() == null ? Map.of() : form.uploadGuide(),
                form.tags() == null ? new LinkedHashSet<>() : new LinkedHashSet<>(form.tags()),
                form.pinned());
    }

    private Template find(Long id) {
        return templates.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
    }

    /**
     * 주제 묶음을 찾는다. 지금은 쓰지 않으므로 비워 두어도 된다.
     *
     * <p>분류는 영상이냐 이미지냐 하나로 충분하다. 템플릿이 많아져 묶을 필요가 생기면 그때 쓴다.
     */
    private Category findCategory(String slug) {
        if (slug == null || slug.isBlank()) {
            return null;
        }
        return categories.findByActiveTrueOrderBySortOrderAscIdAsc().stream()
                .filter(c -> c.getSlug().equals(slug))
                .findFirst()
                .orElse(null);
    }

    private AdminTemplateResponse toResponse(Template t) {
        return AdminTemplateResponse.of(
                t,
                prompts.findByTemplateId(t.getId()).isPresent(),
                pipelines.findByTemplateIdAndActiveTrue(t.getId()).isPresent());
    }
}
