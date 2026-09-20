package com.prompick.template.domain;

import jakarta.persistence.*;

/** 예시 결과물. 운영자가 이 템플릿으로 직접 만든 것만 등록한다. */
@Entity
@Table(name = "template_media")
public class TemplateMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "template_id", nullable = false)
    private Long templateId;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 20)
    private ContentType mediaType;

    @Column(name = "storage_key", nullable = false, length = 500)
    private String storageKey;

    /** 목록에서 자동재생할 저용량 미리보기 */
    @Column(name = "preview_key", length = 500)
    private String previewKey;

    @Column(name = "thumbnail_key", length = 500)
    private String thumbnailKey;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    /**
     * 원본 픽셀 크기.
     *
     * <p>목록에서 타일이 차지할 자리를 잡는 데 쓴다. 읽지 못하는 형식(SVG 등)은 비어 있고,
     * 그때는 화면이 템플릿 출력 비율로 대신한다.
     */
    @Column private Integer width;

    @Column private Integer height;

    protected TemplateMedia() {}

    public TemplateMedia(
            Long templateId,
            ContentType mediaType,
            String storageKey,
            String previewKey,
            String thumbnailKey,
            int sortOrder) {
        this(templateId, mediaType, storageKey, previewKey, thumbnailKey, sortOrder, null, null);
    }

    public TemplateMedia(
            Long templateId,
            ContentType mediaType,
            String storageKey,
            String previewKey,
            String thumbnailKey,
            int sortOrder,
            Integer width,
            Integer height) {
        this.templateId = templateId;
        this.mediaType = mediaType;
        this.storageKey = storageKey;
        this.previewKey = previewKey;
        this.thumbnailKey = thumbnailKey;
        this.sortOrder = sortOrder;
        this.width = width;
        this.height = height;
    }

    /**
     * 화면이 쓸 비율. 예: "281 / 352"
     *
     * <p>CSS aspect-ratio 에 그대로 넣을 수 있는 형태로 준다. 크기를 모르면 null이고,
     * 그때는 화면이 알아서 다른 근거를 찾는다.
     */
    public String aspectRatio() {
        if (width == null || height == null || width <= 0 || height <= 0) {
            return null;
        }
        return width + " / " + height;
    }

    public Integer getWidth() {
        return width;
    }

    public Integer getHeight() {
        return height;
    }

    public Long getId() {
        return id;
    }

    public ContentType getMediaType() {
        return mediaType;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public String getPreviewKey() {
        return previewKey;
    }

    public String getThumbnailKey() {
        return thumbnailKey;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}
