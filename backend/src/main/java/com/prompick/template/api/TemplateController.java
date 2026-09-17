package com.prompick.template.api;

import com.prompick.template.api.dto.*;
import com.prompick.template.app.TemplateQueryService;
import com.prompick.template.app.TemplateQueryService.PricingFilter;
import com.prompick.template.app.TemplateQueryService.SortBy;
import com.prompick.template.domain.ContentType;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.*;

/**
 * 공개 조회 API. 로그인 없이 볼 수 있다.
 *
 * <p>실제 이용(프롬프트 원문 열람, 자동 제작)에서만 로그인을 요구한다. 검색 유입을 살리기 위한 선택이다.
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "템플릿 (공개)")
public class TemplateController {

    private final TemplateQueryService service;

    public TemplateController(TemplateQueryService service) {
        this.service = service;
    }

    @GetMapping("/home")
    @Operation(summary = "홈", description = "섹션별 템플릿 목록")
    public HomeResponse home() {
        return service.home();
    }

    @GetMapping("/categories")
    @Operation(summary = "카테고리 목록")
    public List<CategoryResponse> categories(@RequestParam(required = false) ContentType contentType) {
        return service.categories(contentType);
    }

    @GetMapping("/templates")
    @Operation(summary = "템플릿 목록", description = "커서 기반 무한 스크롤")
    public CursorPage<TemplateCardResponse> list(
            @RequestParam(required = false) ContentType contentType,
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "ALL") PricingFilter pricing,
            @RequestParam(defaultValue = "false") boolean promptOnly,
            @RequestParam(required = false) String ratio,
            @RequestParam(defaultValue = "TREND") SortBy sort,
            @RequestParam(required = false) String cursor,
            @RequestParam(defaultValue = "20") int size) {
        return service.list(contentType, category, pricing, promptOnly, ratio, sort, cursor, size);
    }

    @GetMapping("/templates/search")
    @Operation(summary = "검색", description = "제목·설명·태그")
    public List<TemplateCardResponse> search(@RequestParam("q") String query) {
        return service.search(query);
    }

    @GetMapping("/templates/{slug}")
    @Operation(
            summary = "템플릿 상세",
            description = "파이프라인(내부 프롬프트·모델·파라미터)은 어떤 경우에도 포함되지 않는다")
    public TemplateDetailResponse detail(@PathVariable String slug) {
        return service.detail(slug);
    }
}
