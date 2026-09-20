package com.prompick.generation.domain;

import jakarta.persistence.*;
import java.time.Instant;

/**
 * 단계별 실행 기록. <b>관리자 전용이다.</b>
 *
 * <p>externalJobId와 errorDetail은 외부 제공사에서 온 값이라 사용자 응답에 절대 넣지 않는다.
 * 사용자에게는 몇 번째 단계인지만 보여준다.
 */
@Entity
@Table(name = "generation_job_steps")
public class GenerationJobStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "job_id", nullable = false)
    private Long jobId;

    @Column(name = "step_index", nullable = false)
    private int stepIndex;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private JobStatus status = JobStatus.QUEUED;

    @Column(name = "external_job_id", length = 200)
    private String externalJobId;

    @Column(name = "output_storage_key", length = 500)
    private String outputStorageKey;

    @Column(name = "error_detail", columnDefinition = "text")
    private String errorDetail;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    protected GenerationJobStep() {}

    public GenerationJobStep(Long jobId, int stepIndex) {
        this.jobId = jobId;
        this.stepIndex = stepIndex;
        this.status = JobStatus.RUNNING;
        this.startedAt = Instant.now();
    }

    /**
     * 같은 단계를 다시 시도한다.
     *
     * <p>재시도할 때 기록을 새로 만들면 (작업, 단계) 조합이 겹쳐 저장에 실패한다.
     * 기록은 마지막 시도만 남기고, 이전 시도의 흔적은 덮어쓴다.
     */
    public void restart() {
        this.status = JobStatus.RUNNING;
        this.externalJobId = null;
        this.outputStorageKey = null;
        this.errorDetail = null;
        this.startedAt = Instant.now();
        this.finishedAt = null;
    }

    public void submitted(String externalJobId) {
        this.externalJobId = externalJobId;
    }

    public void succeed(String outputStorageKey) {
        this.status = JobStatus.SUCCEEDED;
        this.outputStorageKey = outputStorageKey;
        this.finishedAt = Instant.now();
    }

    public void fail(String errorDetail) {
        this.status = JobStatus.FAILED;
        this.errorDetail = errorDetail;
        this.finishedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public int getStepIndex() {
        return stepIndex;
    }

    public JobStatus getStatus() {
        return status;
    }

    public String getExternalJobId() {
        return externalJobId;
    }

    /** 실패 원문. 관리자만 본다 — 모델 이름이나 내부 사정이 섞여 있을 수 있다 */
    public String getErrorDetail() {
        return errorDetail;
    }

    public java.time.Instant getStartedAt() {
        return startedAt;
    }

    public java.time.Instant getFinishedAt() {
        return finishedAt;
    }

    public String getOutputStorageKey() {
        return outputStorageKey;
    }
}
