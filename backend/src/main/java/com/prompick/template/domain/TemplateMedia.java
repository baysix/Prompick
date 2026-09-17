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

    protected TemplateMedia() {}

    public TemplateMedia(
            Long templateId,
            ContentType mediaType,
            String storageKey,
            String previewKey,
            String thumbnailKey,
            int sortOrder) {
        this.templateId = templateId;
        this.mediaType = mediaType;
        this.storageKey = storageKey;
        this.previewKey = previewKey;
        this.thumbnailKey = thumbnailKey;
        this.sortOrder = sortOrder;
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
