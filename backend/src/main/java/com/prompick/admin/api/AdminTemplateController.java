package com.prompick.admin.api;

import com.prompick.admin.api.dto.AdminTemplateResponse;
import com.prompick.admin.api.dto.PublicPromptForm;
import com.prompick.admin.api.dto.TemplateForm;
import com.prompick.admin.app.TemplateAdminService;
import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.template.domain.TemplatePublicPrompt;
import com.prompick.template.domain.TemplatePublicPromptRepository;
import com.prompick.template.domain.TemplateRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** 템플릿 관리. 관리자 전용. */
@RestController
@RequestMapping("/api/v1/admin/templates")
@Tag(name = "관리자 - 템플릿")
public class AdminTemplateController {

    private final TemplateAdminService service;
    private final TemplatePublicPromptRepository prompts;
    private final TemplateRepository templates;

    public AdminTemplateController(
            TemplateAdminService service,
            TemplatePublicPromptRepository prompts,
            TemplateRepository templates) {
        this.service = service;
        this.prompts = prompts;
        this.templates = templates;
    }

    @GetMapping
    @Operation(summary = "템플릿 목록", description = "작성 중인 것까지 모두 보여준다")
    public List<AdminTemplateResponse> list() {
        return service.list();
    }

    @GetMapping("/{id}")
    @Operation(summary = "템플릿 조회")
    public AdminTemplateResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    @Operation(summary = "템플릿 만들기", description = "만들면 작성 중 상태로 시작한다")
    public AdminTemplateResponse create(@Valid @RequestBody TemplateForm form) {
        return service.create(form);
    }

    @PutMapping("/{id}")
    @Operation(summary = "템플릿 수정")
    public AdminTemplateResponse update(@PathVariable Long id, @Valid @RequestBody TemplateForm form) {
        return service.update(id, form);
    }

    @PostMapping("/{id}/publish")
    @Operation(
            summary = "게시",
            description = "예시 결과물, 활성 파이프라인, (제공한다면) 프롬프트 원문이 모두 있어야 한다")
    public AdminTemplateResponse publish(@PathVariable Long id) {
        return service.publish(id);
    }

    @PostMapping("/{id}/unpublish")
    @Operation(summary = "내리기")
    public AdminTemplateResponse unpublish(@PathVariable Long id) {
        return service.unpublish(id);
    }

    @GetMapping("/{id}/public-prompt")
    @Operation(summary = "공개 프롬프트 조회")
    public PublicPromptForm getPublicPrompt(@PathVariable Long id) {
        return prompts.findByTemplateId(id)
                .map(p -> new PublicPromptForm(
                        p.getBody(), p.getNegativePrompt(), p.getRecommendedTool(), p.getUsageTip()))
                .orElse(new PublicPromptForm("", null, null, null));
    }

    @PutMapping("/{id}/public-prompt")
    @Operation(
            summary = "공개 프롬프트 등록",
            description = "사용자가 복사해 갈 원문이다. 서버가 실행하는 내부 프롬프트와는 다르다")
    @Transactional
    public PublicPromptForm putPublicPrompt(
            @PathVariable Long id, @Valid @RequestBody PublicPromptForm form) {
        if (!templates.existsById(id)) {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }
        TemplatePublicPrompt prompt =
                prompts.findByTemplateId(id).orElseGet(() -> new TemplatePublicPrompt(id));
        prompt.update(form.body(), form.negativePrompt(), form.recommendedTool(), form.usageTip());
        prompts.save(prompt);
        return form;
    }
}
