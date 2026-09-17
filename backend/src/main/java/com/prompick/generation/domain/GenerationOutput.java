package com.prompick.generation.domain;

import com.prompick.template.domain.ContentType;
import jakarta.persistence.*;
import java.time.Instant;

/** 완성된 결과물. 보관 기간이 지나면 파일을 지운다. */
@Entity
@Table(name = "generation_outputs")
public class GenerationOutput {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 20)
    private ContentType mediaType;

    @Column(name = "storage_key", nullable = false, length = 500)
    private String storageKey;

    @Column(name = "thumbnail_key", length = 500)
    private String thumbnailKey;

    @Column(nullable = false)
    private boolean watermarked;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    protected GenerationOutput() {}

    public GenerationOutput(
            Long jobId, ContentType mediaType, String storageKey, boolean watermarked, Instant expiresAt) {
        this.jobId = jobId;
        this.mediaType = mediaType;
        this.storageKey = storageKey;
        this.thumbnailKey = storageKey;
        this.watermarked = watermarked;
        this.expiresAt = expiresAt;
    }

    public void markDeleted() {
        this.deletedAt = Instant.now();
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public Long getId() {
        return id;
    }

    public Long getJobId() {
        return jobId;
    }

    public ContentType getMediaType() {
        return mediaType;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public String getThumbnailKey() {
        return thumbnailKey;
    }

    public boolean isWatermarked() {
        return watermarked;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }
}
