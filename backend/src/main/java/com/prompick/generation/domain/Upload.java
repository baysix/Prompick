package com.prompick.generation.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** 사용자가 올린 원본 사진 */
@Entity
@Table(name = "uploads")
public class Upload {

    public enum CheckStatus {
        PENDING,
        /** 통과 */
        PASSED,
        /** 경고는 있지만 사용자가 확인하면 진행 가능 */
        WARNED,
        /** 이 사진으로는 제작할 수 없다 */
        BLOCKED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "storage_key", nullable = false, length = 500)
    private String storageKey;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "size_bytes")
    private Long sizeBytes;

    private Integer width;
    private Integer height;

    @Enumerated(EnumType.STRING)
    @Column(name = "check_status", nullable = false, length = 10)
    private CheckStatus checkStatus = CheckStatus.PENDING;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "check_result", nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> checkResult = Map.of();

    @Column(name = "expires_at")
    private Instant expiresAt;

    protected Upload() {}

    public Upload(Long userId, String storageKey, String mimeType, Instant expiresAt) {
        this.userId = userId;
        this.storageKey = storageKey;
        this.mimeType = mimeType;
        this.expiresAt = expiresAt;
    }

    public void recordCheck(
            CheckStatus status, Map<String, Object> result, Long sizeBytes, Integer width, Integer height) {
        this.checkStatus = status;
        this.checkResult = result;
        this.sizeBytes = sizeBytes;
        this.width = width;
        this.height = height;
    }

    public boolean isUsable() {
        return checkStatus == CheckStatus.PASSED || checkStatus == CheckStatus.WARNED;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public String getMimeType() {
        return mimeType;
    }

    public CheckStatus getCheckStatus() {
        return checkStatus;
    }

    public Map<String, Object> getCheckResult() {
        return checkResult;
    }
}
