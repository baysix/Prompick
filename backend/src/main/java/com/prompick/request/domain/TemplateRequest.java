package com.prompick.request.domain;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * 만들어 달라는 요청 하나.
 *
 * <p>추천 수를 이 안에 들고 있다. 투표 표를 세어도 되지만, 목록을 추천순으로 정렬할 때마다
 * 전부 세면 요청이 쌓일수록 느려진다. 대신 투표와 함께 반드시 갱신되도록 서비스가 책임진다.
 */
@Entity
@Table(name = "template_requests")
public class TemplateRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(name = "reference_url", length = 500)
    private String referenceUrl;

    @Column(columnDefinition = "text")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RequestStatus status = RequestStatus.PENDING;

    @Column(name = "vote_count", nullable = false)
    private int voteCount;

    @Column(name = "template_id")
    private Long templateId;

    @Column(name = "admin_note", columnDefinition = "text")
    private String adminNote;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected TemplateRequest() {}

    public TemplateRequest(Long userId, String title, String referenceUrl, String description) {
        this.userId = userId;
        this.title = title;
        this.referenceUrl = referenceUrl;
        this.description = description;
    }

    /**
     * 진행 상태를 바꾼다.
     *
     * <p>완성으로 바꾸려면 어느 템플릿이 되었는지 알려줘야 하고, 반려하려면 이유를 적어야 한다.
     * 둘 다 올린 사람이 결과를 확인할 수 있어야 하기 때문이다. 아무 말 없이 닫히는 요청은
     * 다음부터 아무도 올리지 않게 만든다.
     */
    public void moveTo(RequestStatus next, Long templateId, String adminNote) {
        if (next == RequestStatus.DONE && templateId == null) {
            throw new IllegalArgumentException("완성으로 바꾸려면 만들어진 템플릿을 지정해주세요");
        }
        if (next == RequestStatus.REJECTED && (adminNote == null || adminNote.isBlank())) {
            throw new IllegalArgumentException("반려하려면 이유를 적어주세요");
        }
        this.status = next;
        this.templateId = templateId;
        this.adminNote = adminNote;
        this.updatedAt = Instant.now();
    }

    /**
     * 추천 수를 올리거나 내린다.
     *
     * <p><b>RequestService 말고는 부르지 않는다.</b> 투표 표를 함께 고치지 않으면 추천 수가
     * 실제 표와 어긋나고, 그 순간 만들 순서를 정하는 근거로 쓸 수 없게 된다.
     */
    public void addVote(int delta) {
        this.voteCount = Math.max(0, this.voteCount + delta);
    }

    /** 올린 사람만 지울 수 있다. 이미 만들기 시작했으면 지우지 못한다 */
    public boolean isDeletableBy(Long userId) {
        return this.userId.equals(userId) && status == RequestStatus.PENDING;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getTitle() {
        return title;
    }

    public String getReferenceUrl() {
        return referenceUrl;
    }

    public String getDescription() {
        return description;
    }

    public RequestStatus getStatus() {
        return status;
    }

    public int getVoteCount() {
        return voteCount;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
