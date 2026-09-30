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

    /**
     * 영상 길이(초). 사진이면 비어 있다.
     *
     * <p>서버가 파일에서 직접 재어 넣는다. 영상 제작의 요금이 이 값에 비례하므로, 브라우저가
     * 알려준 숫자를 믿으면 그 숫자를 고치는 것만으로 우리 돈이 나간다.
     */
    @Column(name = "duration_seconds", precision = 8, scale = 2)
    private java.math.BigDecimal durationSeconds;

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

    /** 영상 검사 결과를 적는다. 크기는 재지 않는다 — 해상도가 아니라 길이가 요금을 정한다 */
    public void recordVideoCheck(
            CheckStatus status, Map<String, Object> result, Long sizeBytes, Double seconds) {
        this.checkStatus = status;
        this.checkResult = result;
        this.sizeBytes = sizeBytes;
        this.durationSeconds =
                seconds == null
                        ? null
                        : java.math.BigDecimal.valueOf(seconds)
                                .setScale(2, java.math.RoundingMode.HALF_UP);
    }

    public java.math.BigDecimal getDurationSeconds() {
        return durationSeconds;
    }

    public boolean isVideo() {
        return mimeType != null && mimeType.toLowerCase().startsWith("video/");
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
