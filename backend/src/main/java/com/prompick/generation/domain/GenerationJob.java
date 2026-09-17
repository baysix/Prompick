package com.prompick.generation.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Map;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/**
 * 제작 요청 한 건.
 *
 * <p>요청은 작업을 만들어두기만 하고 바로 끝난다. 실제 실행은 워커가 이어받으므로 사용자가
 * 페이지를 떠나도 계속 진행된다.
 *
 * <p>요금과 파이프라인 버전을 요청 시점 값으로 박아 둔다. 관리자가 중간에 가격이나 제작 방식을
 * 바꿔도 이미 시작한 작업은 시작할 때의 조건으로 끝난다.
 */
@Entity
@Table(name = "generation_jobs")
public class GenerationJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "template_id", nullable = false)
    private Long templateId;

    @Column(name = "pipeline_id", nullable = false)
    private Long pipelineId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private JobStatus status = JobStatus.QUEUED;

    @Enumerated(EnumType.STRING)
    @Column(name = "charge_type", nullable = false, length = 10)
    private ChargeType chargeType;

    @Column(name = "credit_cost_snapshot", nullable = false)
    private int creditCostSnapshot;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private Map<String, Object> inputs = Map.of();

    @Column(name = "current_step", nullable = false)
    private int currentStep;

    @Column(name = "total_steps", nullable = false)
    private int totalSteps;

    @Column(name = "error_code", length = 50)
    private String errorCode;

    @Column(name = "idempotency_key", nullable = false, length = 100)
    private String idempotencyKey;

    @Column(name = "locked_by", length = 60)
    private String lockedBy;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @Column(name = "retry_count", nullable = false)
    private int retryCount;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    protected GenerationJob() {}

    public GenerationJob(
            Long userId,
            Long templateId,
            Long pipelineId,
            ChargeType chargeType,
            int creditCostSnapshot,
            Map<String, Object> inputs,
            int totalSteps,
            String idempotencyKey) {
        this.userId = userId;
        this.templateId = templateId;
        this.pipelineId = pipelineId;
        this.chargeType = chargeType;
        this.creditCostSnapshot = creditCostSnapshot;
        this.inputs = inputs;
        this.totalSteps = totalSteps;
        this.idempotencyKey = idempotencyKey;
    }

    /** 워커가 집어간다. lockedUntil이 지나면 다른 워커가 이어받을 수 있다. */
    public void lock(String workerId, Instant until) {
        this.lockedBy = workerId;
        this.lockedUntil = until;
        if (this.status == JobStatus.QUEUED) {
            this.status = JobStatus.RUNNING;
            this.startedAt = Instant.now();
        }
    }

    public void extendLock(Instant until) {
        this.lockedUntil = until;
    }

    public void advanceTo(int stepIndex) {
        this.currentStep = stepIndex;
    }

    public void succeed() {
        this.status = JobStatus.SUCCEEDED;
        this.currentStep = this.totalSteps;
        this.finishedAt = Instant.now();
        this.lockedBy = null;
        this.lockedUntil = null;
    }

    public void fail(String errorCode) {
        this.status = JobStatus.FAILED;
        this.errorCode = errorCode;
        this.finishedAt = Instant.now();
        this.lockedBy = null;
        this.lockedUntil = null;
    }

    /** 일시적인 오류. 다시 대기열로 보낸다. */
    public void requeue() {
        this.status = JobStatus.QUEUED;
        this.retryCount++;
        this.lockedBy = null;
        this.lockedUntil = null;
    }

    public boolean isPaid() {
        return chargeType == ChargeType.PAID;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getTemplateId() {
        return templateId;
    }

    public Long getPipelineId() {
        return pipelineId;
    }

    public JobStatus getStatus() {
        return status;
    }

    public ChargeType getChargeType() {
        return chargeType;
    }

    public int getCreditCostSnapshot() {
        return creditCostSnapshot;
    }

    public Map<String, Object> getInputs() {
        return inputs;
    }

    public int getCurrentStep() {
        return currentStep;
    }

    public int getTotalSteps() {
        return totalSteps;
    }

    public String getErrorCode() {
        return errorCode;
    }

    public int getRetryCount() {
        return retryCount;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getFinishedAt() {
        return finishedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
