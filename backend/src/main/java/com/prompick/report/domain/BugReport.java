package com.prompick.report.domain;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * 오류 신고 하나.
 *
 * <p>화면 주소와 브라우저 정보는 사용자가 적지 않는다. 신고 화면이 자동으로 채운다. 사람이
 * 기억해서 적은 위치는 자주 틀리고, 틀리면 재현하는 데 드는 시간이 배로 든다.
 */
@Entity
@Table(name = "bug_reports")
public class BugReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String body;

    @Column(name = "page_url", length = 500)
    private String pageUrl;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private BugReportStatus status = BugReportStatus.OPEN;

    @Column(name = "admin_note", columnDefinition = "text")
    private String adminNote;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    protected BugReport() {}

    public BugReport(Long userId, String title, String body, String pageUrl, String userAgent) {
        this.userId = userId;
        this.title = title;
        this.body = body;
        this.pageUrl = pageUrl;
        this.userAgent = userAgent;
    }

    /**
     * 운영자가 상태를 바꾼다.
     *
     * <p>오류가 아니라고 닫을 때는 이유를 반드시 받는다. 이유 없이 닫힌 신고는 올린 사람에게
     * 무시당한 것과 같고, 그다음부터는 아무도 신고하지 않는다.
     */
    public void resolve(BugReportStatus status, String adminNote) {
        this.status = status;
        this.adminNote = adminNote;
        this.updatedAt = Instant.now();
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

    public String getBody() {
        return body;
    }

    public String getPageUrl() {
        return pageUrl;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public BugReportStatus getStatus() {
        return status;
    }

    public String getAdminNote() {
        return adminNote;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
