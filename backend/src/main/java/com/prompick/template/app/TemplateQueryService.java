package com.prompick.template.app;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.template.api.dto.*;
import com.prompick.template.domain.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 사용자용 템플릿 조회. 비로그인도 여기까지는 볼 수 있다. */
@Service
@Transactional(readOnly = true)
public class TemplateQueryService {

    /** 요금 필터 */
    public enum PricingFilter {
        ALL,
        FREE,
        PAID
    }

    /** 정렬 */
    public enum SortBy {
        TREND,
        LATEST
    }

    private static final int MAX_PAGE_SIZE = 40;

    private final TemplateRepository templates;
    private final CategoryRepository categories;
    private final TemplatePublicPromptRepository prompts;
    private final TemplateAssembler assembler;

    public TemplateQueryService(
            TemplateRepository templates,
            CategoryRepository categories,
            TemplatePublicPromptRepository prompts,
            TemplateAssembler assembler) {
        this.templates = templates;
        this.categories = categories;
        this.prompts = prompts;
        this.assembler = assembler;
    }

    public List<CategoryResponse> categories(ContentType contentType) {
        List<Category> found = contentType == null
                ? categories.findByActiveTrueOrderBySortOrderAscIdAsc()
                : categories.findByActiveTrueAndContentTypeOrderBySortOrderAscIdAsc(contentType);
        return found.stream()
                .map(c -> new CategoryResponse(c.getSlug(), c.getName(), c.getContentType()))
                .toList();
    }

    /**
     * 홈.
     *
     * <p>묶음마다 개수를 자르지 않는다. 열 개로 자르던 시절에는 템플릿이 열한 개가 되는 순간
     * 가장 오래된 것이 어느 묶음에도 나오지 않고 사라졌다. 공개해 둔 템플릿이 홈에서 안 보이는
     * 것은 운영자에게도 사용자에게도 사고다.
     *
     * <p>템플릿이 수백 개가 되면 다시 생각해야 한다. 그때는 자르는 것이 아니라 묶음 자체를
     * 다르게 짜야 한다 — 열 개로 자르든 스무 개로 자르든 같은 문제가 되돌아온다.
     */
    public HomeResponse home() {
        List<HomeResponse.Section> sections = new ArrayList<>();

        sections.add(section(
                "trending",
                "이번 주 많이 만든 것",
                null,
                templates.findTopTrending(null, Limit.unlimited())));

        sections.add(section(
                "free-prompt",
                "프롬프트를 바로 받아 가요",
                "복사해서 쓰던 AI에 그대로 붙여넣으면 돼요",
                templates.findByPromptAccess(PromptAccess.FREE, Limit.unlimited())));

        sections.add(section(
                "free-generate",
                "무료로 만들어 볼 수 있어요",
                null,
                templates.findByGenerateAccess(GenerateAccess.FREE, Limit.unlimited())));

        sections.add(section(
                "exclusive",
                "여기서만 만들 수 있어요",
                "프롬프트를 공개하지 않는 템플릿이에요",
                templates.findByPromptAccess(PromptAccess.HIDDEN, Limit.unlimited())));

        sections.add(section(
                "newest", "새로 올라왔어요", null, templates.findNewest(Limit.unlimited())));

        // 내용이 없는 섹션은 내려보내지 않는다. 화면에 빈 줄이 생기지 않게.
        return new HomeResponse(sections.stream().filter(s -> !s.items().isEmpty()).toList());
    }

    public CursorPage<TemplateCardResponse> list(
            ContentType contentType,
            String categorySlug,
            PricingFilter pricing,
            boolean promptOnly,
            String ratio,
            SortBy sort,
            String cursor,
            int size) {

        int pageSize = Math.clamp(size, 1, MAX_PAGE_SIZE);
        Cursor parsed = Cursor.decode(cursor);
        boolean freeOnly = pricing == PricingFilter.FREE;
        boolean paidOnly = pricing == PricingFilter.PAID;

        // 다음 페이지가 있는지 알기 위해 한 건 더 가져온다.
        Limit limit = Limit.of(pageSize + 1);
        List<Template> found = sort == SortBy.LATEST
                ? templates.findByLatest(
                        contentType, categorySlug, promptOnly, freeOnly, paidOnly, ratio,
                        parsed == null ? null : parsed.id(), limit)
                : templates.findByTrend(
                        contentType, categorySlug, promptOnly, freeOnly, paidOnly, ratio,
                        parsed == null ? null : parsed.score(),
                        parsed == null ? null : parsed.id(), limit);

        boolean hasNext = found.size() > pageSize;
        List<Template> page = hasNext ? found.subList(0, pageSize) : found;
        String nextCursor = null;
        if (hasNext) {
            Template last = page.get(page.size() - 1);
            nextCursor = new Cursor(last.getTrendScore(), last.getId()).encode();
        }
        return CursorPage.of(assembler.toCards(page), nextCursor);
    }

    public List<TemplateCardResponse> search(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return assembler.toCards(templates.search(query.trim(), Limit.of(MAX_PAGE_SIZE)));
    }

    /**
     * 상세.
     *
     * <p>프롬프트 원문은 {@code promptAccess}가 FREE일 때만 내려간다. PAID는 열람권 확인이 필요하므로
     * 5단계에서 연결하고, 지금은 잠긴 상태로 응답한다. HIDDEN은 어떤 경우에도 내려가지 않는다.
     */
    public TemplateDetailResponse detail(String slug) {
        Template template = templates
                .findPublishedBySlug(slug)
                .orElseThrow(() -> new ApiException(ErrorCode.TEMPLATE_NOT_AVAILABLE));

        TemplatePublicPrompt prompt = null;
        if (template.getPromptAccess() == PromptAccess.FREE) {
            prompt = prompts.findByTemplateId(template.getId()).orElse(null);
        }
        return assembler.toDetail(template, prompt);
    }

    private HomeResponse.Section section(
            String key, String title, String subtitle, List<Template> items) {
        return new HomeResponse.Section(key, title, subtitle, assembler.toCards(items));
    }

    /** 커서. 정렬키와 id를 함께 담아 같은 값이 여러 개여도 건너뛰지 않게 한다. */
    private record Cursor(BigDecimal score, Long id) {

        String encode() {
            String raw = (score == null ? "0" : score.toPlainString()) + ":" + id;
            return Base64.getUrlEncoder().withoutPadding()
                    .encodeToString(raw.getBytes(StandardCharsets.UTF_8));
        }

        static Cursor decode(String cursor) {
            if (cursor == null || cursor.isBlank()) {
                return null;
            }
            try {
                String raw = new String(
                        Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
                int sep = raw.lastIndexOf(':');
                return new Cursor(
                        new BigDecimal(raw.substring(0, sep)), Long.valueOf(raw.substring(sep + 1)));
            } catch (RuntimeException e) {
                throw new ApiException(ErrorCode.INVALID_REQUEST);
            }
        }
    }
}
