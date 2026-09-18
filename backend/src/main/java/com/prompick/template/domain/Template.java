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

    /**
     * 주제 묶음. 지금은 쓰지 않는다.
     *
     * <p>분류는 "영상이냐 이미지냐" 하나로 충분하다. 그 아래 주제까지 두면 층이 두 개가 되어
     * 고를 것이 늘기만 한다. 템플릿이 많아져 묶을 필요가 생기면 그때 다시 쓴다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
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

    public Template(String slug, String title, ContentType contentType, Category category) {
        this.slug = slug;
        this.title = title;
        this.contentType = contentType;
        this.category = category;
    }

    /**
     * 관리자 화면에서 넘어온 값으로 갱신한다.
     *
     * <p>요금 규칙은 DB 제약으로도 막혀 있지만, 사용자에게 읽을 수 있는 메시지를 주려고
     * 여기서 먼저 정리한다. 무료·비공개인데 가격이 남아 있으면 0으로 맞춘다.
     */
    public void update(
            String title,
            String description,
            ContentType contentType,
            Category category,
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
            Set<String> tags,
            boolean pinned) {
        this.title = title;
        this.description = description;
        this.contentType = contentType;
        this.category = category;
        this.promptAccess = promptAccess;
        this.promptCost = promptAccess == PromptAccess.PAID ? promptCost : 0;
        this.generateAccess = generateAccess;
        this.generateCost = generateAccess == GenerateAccess.PAID ? generateCost : 0;
        this.ratio = ratio;
        this.durationSeconds = durationSeconds;
        this.resolution = resolution;
        this.estimatedSeconds = estimatedSeconds;
        this.requiredPhotoSummary = requiredPhotoSummary;
        this.uploadGuide = uploadGuide == null ? Map.of() : uploadGuide;
        this.tags = tags == null ? new LinkedHashSet<>() : new LinkedHashSet<>(tags);
        this.pinned = pinned;
    }

    /** 게시. 처음 게시하는 순간을 기록해 신규 목록 정렬에 쓴다. */
    public void publish() {
        this.status = TemplateStatus.PUBLISHED;
        if (this.publishedAt == null) {
            this.publishedAt = Instant.now();
        }
    }

    public void unpublish() {
        this.status = TemplateStatus.HIDDEN;
    }

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
