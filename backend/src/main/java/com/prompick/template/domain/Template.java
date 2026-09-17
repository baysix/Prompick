package com.prompick.template.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 템플릿. 사용자에게 보이는 영역만 담는다.
 *
 * <p><b>이 엔티티에는 파이프라인으로 가는 연관관계가 없다.</b> 실수로라도 함께 조회되어 응답에 섞이지 않도록,
 * {@code template_pipelines}는 별도 애그리거트로 관리한다.
 */
@Entity
@Table(name = "templates")
public class Template {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120, unique = true)
    private String slug;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false, length = 20)
    private ContentType contentType;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id")
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(name = "prompt_access", nullable = false, length = 10)
    private PromptAccess promptAccess = PromptAccess.HIDDEN;

    @Column(name = "prompt_cost", nullable = false)
    private int promptCost;

    @Enumerated(EnumType.STRING)
    @Column(name = "generate_access", nullable = false, length = 10)
    private GenerateAccess generateAccess = GenerateAccess.PAID;

    @Column(name = "generate_cost", nullable = false)
    private int generateCost;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TemplateStatus status = TemplateStatus.DRAFT;

    /** 9:16 / 1:1 / 16:9. 탐색 필터로 쓰인다 */
    @Column(nullable = false, length = 10)
    private String ratio = "9:16";

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(length = 20)
    private String resolution;

    @Column(name = "estimated_seconds", nullable = false)
    private int estimatedSeconds;

    @Column(name = "required_photo_summary", length = 100)
    private String requiredPhotoSummary;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "upload_guide", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> uploadGuide = Map.of();

    @Column(nullable = false)
    private boolean pinned;

    @Column(name = "trend_score", nullable = false)
    private BigDecimal trendScore = BigDecimal.ZERO;

    @Column(name = "generation_count", nullable = false)
    private long generationCount;

    @Column(name = "view_count", nullable = false)
    private long viewCount;

    @Column(name = "favorite_count", nullable = false)
    private long favoriteCount;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "template_tags", joinColumns = @JoinColumn(name = "template_id"))
    @Column(name = "tag", length = 40)
    private Set<String> tags = new LinkedHashSet<>();

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    @OrderBy("sortOrder asc, id asc")
    private List<TemplateMedia> media = new ArrayList<>();

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    @OrderBy("sortOrder asc, id asc")
    private List<TemplateInputField> inputFields = new ArrayList<>();

    protected Template() {}

    /** 목록·상세에 쓸 대표 예시 결과물 */
    public TemplateMedia primaryMedia() {
        return media.isEmpty() ? null : media.get(0);
    }

    public boolean isPromptDisclosed() {
        return promptAccess.isDisclosed();
    }

    public Long getId() {
        return id;
    }

    public String getSlug() {
        return slug;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public ContentType getContentType() {
        return contentType;
    }

    public Category getCategory() {
        return category;
    }

    public PromptAccess getPromptAccess() {
        return promptAccess;
    }

    public int getPromptCost() {
        return promptCost;
    }

    public GenerateAccess getGenerateAccess() {
        return generateAccess;
    }

    public int getGenerateCost() {
        return generateCost;
    }

    public TemplateStatus getStatus() {
        return status;
    }

    public String getRatio() {
        return ratio;
    }

    public Integer getDurationSeconds() {
        return durationSeconds;
    }

    public String getResolution() {
        return resolution;
    }

    public int getEstimatedSeconds() {
        return estimatedSeconds;
    }

    public String getRequiredPhotoSummary() {
        return requiredPhotoSummary;
    }

    public Map<String, Object> getUploadGuide() {
        return uploadGuide;
    }

    public boolean isPinned() {
        return pinned;
    }

    public BigDecimal getTrendScore() {
        return trendScore;
    }

    public long getGenerationCount() {
        return generationCount;
    }

    public long getViewCount() {
        return viewCount;
    }

    public long getFavoriteCount() {
        return favoriteCount;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public Set<String> getTags() {
        return tags;
    }

    public List<TemplateMedia> getMedia() {
        return media;
    }

    public List<TemplateInputField> getInputFields() {
        return inputFields;
    }
}
