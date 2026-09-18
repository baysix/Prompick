package com.prompick.template.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TemplateRepository extends JpaRepository<Template, Long> {

    // 주제 묶음은 선택 항목이라 비어 있을 수 있다. 내부 조인으로 가져오면 묶음이 없는
    // 템플릿이 통째로 목록에서 빠진다.

    @Query("""
            select t from Template t
              left join fetch t.category
             where t.slug = :slug and t.status = com.prompick.template.domain.TemplateStatus.PUBLISHED
            """)
    Optional<Template> findPublishedBySlug(@Param("slug") String slug);

    /**
     * 목록 조회. 커서는 (정렬키, id) 쌍으로 동작한다.
     *
     * <p>파이프라인은 어떤 경로로도 조인되지 않는다. Template 엔티티에 연관관계 자체가 없다.
     */
    @Query("""
            select t from Template t
              left join fetch t.category c
             where t.status = com.prompick.template.domain.TemplateStatus.PUBLISHED
               and (:contentType is null or t.contentType = :contentType)
               and (:categorySlug is null or c.slug = :categorySlug)
               and (:promptOnly = false or t.promptAccess <> com.prompick.template.domain.PromptAccess.HIDDEN)
               and (:freeOnly = false or t.generateAccess = com.prompick.template.domain.GenerateAccess.FREE
                    or t.promptAccess = com.prompick.template.domain.PromptAccess.FREE)
               and (:paidOnly = false or t.generateAccess = com.prompick.template.domain.GenerateAccess.PAID
                    or t.promptAccess = com.prompick.template.domain.PromptAccess.PAID)
               and (:ratio is null or t.ratio = :ratio)
               and (:cursorScore is null
                    or t.trendScore < :cursorScore
                    or (t.trendScore = :cursorScore and t.id < :cursorId))
             order by t.pinned desc, t.trendScore desc, t.id desc
            """)
    List<Template> findByTrend(
            @Param("contentType") ContentType contentType,
            @Param("categorySlug") String categorySlug,
            @Param("promptOnly") boolean promptOnly,
            @Param("freeOnly") boolean freeOnly,
            @Param("paidOnly") boolean paidOnly,
            @Param("ratio") String ratio,
            @Param("cursorScore") java.math.BigDecimal cursorScore,
            @Param("cursorId") Long cursorId,
            Limit limit);

    @Query("""
            select t from Template t
              left join fetch t.category c
             where t.status = com.prompick.template.domain.TemplateStatus.PUBLISHED
               and (:contentType is null or t.contentType = :contentType)
               and (:categorySlug is null or c.slug = :categorySlug)
               and (:promptOnly = false or t.promptAccess <> com.prompick.template.domain.PromptAccess.HIDDEN)
               and (:freeOnly = false or t.generateAccess = com.prompick.template.domain.GenerateAccess.FREE
                    or t.promptAccess = com.prompick.template.domain.PromptAccess.FREE)
               and (:paidOnly = false or t.generateAccess = com.prompick.template.domain.GenerateAccess.PAID
                    or t.promptAccess = com.prompick.template.domain.PromptAccess.PAID)
               and (:ratio is null or t.ratio = :ratio)
               and (:cursorId is null or t.id < :cursorId)
             order by t.id desc
            """)
    List<Template> findByLatest(
            @Param("contentType") ContentType contentType,
            @Param("categorySlug") String categorySlug,
            @Param("promptOnly") boolean promptOnly,
            @Param("freeOnly") boolean freeOnly,
            @Param("paidOnly") boolean paidOnly,
            @Param("ratio") String ratio,
            @Param("cursorId") Long cursorId,
            Limit limit);

    @Query("""
            select t from Template t
              left join fetch t.category
             where t.status = com.prompick.template.domain.TemplateStatus.PUBLISHED
               and (:contentType is null or t.contentType = :contentType)
             order by t.pinned desc, t.trendScore desc, t.id desc
            """)
    List<Template> findTopTrending(@Param("contentType") ContentType contentType, Limit limit);

    @Query("""
            select t from Template t
              left join fetch t.category
             where t.status = com.prompick.template.domain.TemplateStatus.PUBLISHED
               and t.promptAccess = :access
             order by t.trendScore desc, t.id desc
            """)
    List<Template> findByPromptAccess(@Param("access") PromptAccess access, Limit limit);

    @Query("""
            select t from Template t
              left join fetch t.category
             where t.status = com.prompick.template.domain.TemplateStatus.PUBLISHED
               and t.generateAccess = :access
             order by t.trendScore desc, t.id desc
            """)
    List<Template> findByGenerateAccess(@Param("access") GenerateAccess access, Limit limit);

    @Query("""
            select t from Template t
              left join fetch t.category
             where t.status = com.prompick.template.domain.TemplateStatus.PUBLISHED
             order by t.publishedAt desc nulls last, t.id desc
            """)
    List<Template> findNewest(Limit limit);

    /** 제목·설명·태그 검색 */
    @Query("""
            select distinct t from Template t
              left join fetch t.category
              left join t.tags tag
             where t.status = com.prompick.template.domain.TemplateStatus.PUBLISHED
               and (lower(t.title) like lower(concat('%', :q, '%'))
                 or lower(t.description) like lower(concat('%', :q, '%'))
                 or lower(tag) like lower(concat('%', :q, '%')))
             order by t.trendScore desc, t.id desc
            """)
    List<Template> search(@Param("q") String q, Limit limit);
}
