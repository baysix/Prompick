package com.prompick.notice.domain;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * 공지 하나.
 *
 * <p>쓰는 것과 내보내는 것을 나눈다. {@code publishedAt} 이 비어 있으면 아직 작성 중이고,
 * 사용자 목록에 나가지 않는다. 점검 공지처럼 시각이 중요한 글은 미리 써 두고 때가 되었을 때
 * 내보내야 하는데, 저장이 곧 공개라면 그럴 수 없다.
 */
@Entity
@Table(name = "notices")
public class Notice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String body;

    @Column(nullable = false)
    private boolean pinned;

    @Column(name = "published_at")
    private Instant publishedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected Notice() {}

    public Notice(String title, String body, boolean pinned) {
        this.title = title;
        this.body = body;
        this.pinned = pinned;
    }

    public void update(String title, String body, boolean pinned) {
        this.title = title;
        this.body = body;
        this.pinned = pinned;
        this.updatedAt = Instant.now();
    }

    /** 내보낸다. 이미 나간 공지의 시각은 건드리지 않는다 — 목록 순서가 뒤집히면 읽는 사람이 헷갈린다 */
    public void publish() {
        if (publishedAt == null) {
            this.publishedAt = Instant.now();
        }
        this.updatedAt = Instant.now();
    }

    /** 내린다. 잘못 쓴 공지를 지우는 대신 감춘다 — 지우면 무엇을 잘못 알렸는지도 함께 사라진다 */
    public void unpublish() {
        this.publishedAt = null;
        this.updatedAt = Instant.now();
    }

    public boolean isPublished() {
        return publishedAt != null;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getBody() {
        return body;
    }

    public boolean isPinned() {
        return pinned;
    }

    public Instant getPublishedAt() {
        return publishedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
