package com.prompick.generation.app;

import com.prompick.common.error.ErrorCode;
import com.prompick.generation.domain.GenerationJob;
import com.prompick.generation.domain.JobRepository;
import com.prompick.template.domain.Template;
import com.prompick.template.domain.TemplatePipeline;
import com.prompick.template.domain.TemplatePipelineRepository;
import com.prompick.template.domain.TemplateRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 제작 작업을 실행하는 워커.
 *
 * <p>대기 중인 작업을 집어 들고 파이프라인을 끝까지 돌린다. 여러 대가 동시에 돌아도 같은 작업을
 * 중복 실행하지 않는다 — 집어 들 때 행을 잠그고, 이미 잠긴 행은 건너뛴다.
 *
 * <p>잠금에 만료 시각을 둔다. 워커가 배포나 장애로 죽으면 그 작업은 영원히 진행 중으로 남는데,
 * 만료가 지나면 다른 워커가 이어받는다.
 *
 * <p>상태 변경은 {@link JobStateService}에 맡긴다. 같은 클래스 안에서 트랜잭션 메서드를 부르면
 * 프록시를 거치지 않아 트랜잭션이 걸리지 않고, 변경이 저장되지 않는다.
 */
@Component
public class GenerationWorker {

    private static final Logger log = LoggerFactory.getLogger(GenerationWorker.class);

    /** 한 번에 집어 들 작업 수 */
    private static final int BATCH_SIZE = 3;

    /** 잠금 유지 시간. 이 시간이 지나면 다른 워커가 가져갈 수 있다 */
    private static final Duration LOCK_DURATION = Duration.ofMinutes(10);

    /** 일시적 오류일 때 다시 시도하는 최대 횟수 */
    private static final int MAX_RETRY = 2;

    /** 제작이 이 시간을 넘기면 실패로 정리한다 */
    private static final Duration STUCK_THRESHOLD = Duration.ofMinutes(20);

    /** 이 워커를 구분하는 이름. 누가 집어갔는지 추적할 때 쓴다 */
    private final String workerId = "worker-" + UUID.randomUUID().toString().substring(0, 8);

    private final JobRepository jobs;
    private final JobStateService state;
    private final TemplateRepository templates;
    private final TemplatePipelineRepository pipelines;
    private final PipelineExecutor executor;
    private final JobRefundService refunds;

    public GenerationWorker(
            JobRepository jobs,
            JobStateService state,
            TemplateRepository templates,
            TemplatePipelineRepository pipelines,
            PipelineExecutor executor,
            JobRefundService refunds) {
        this.jobs = jobs;
        this.state = state;
        this.templates = templates;
        this.pipelines = pipelines;
        this.executor = executor;
        this.refunds = refunds;
    }

    /** 대기 중인 작업을 찾아 실행한다. */
    @Scheduled(fixedDelayString = "${prompick.worker.poll-ms:3000}")
    public void poll() {
        List<Long> picked;
        try {
            picked = state.pickUp(workerId, BATCH_SIZE, LOCK_DURATION);
        } catch (RuntimeException e) {
            log.error("작업을 집어 드는 중 오류", e);
            return;
        }

        for (Long jobId : picked) {
            try {
                run(jobId);
            } catch (RuntimeException e) {
                log.error("작업 처리 중 예기치 못한 오류: job={}", jobId, e);
            }
        }
    }

    /** 파이프라인을 실행하고 결과에 따라 마무리한다. */
    private void run(Long jobId) {
        GenerationJob job = jobs.findById(jobId).orElse(null);
        if (job == null || job.getStatus().isFinished()) {
            return;
        }

        Template template = templates.findById(job.getTemplateId()).orElse(null);
        TemplatePipeline pipeline = pipelines.findById(job.getPipelineId()).orElse(null);

        if (template == null || pipeline == null) {
            state.fail(jobId, ErrorCode.GENERATION_FAILED.name());
            return;
        }

        log.info("제작 시작: job={} template={} 단계={}", jobId, template.getSlug(), job.getTotalSteps());

        try {
            executor.execute(job, pipeline, template.getContentType(), stepIndex -> state.advance(jobId, stepIndex));
            state.succeed(jobId);
            log.info("제작 완료: job={}", jobId);

        } catch (PipelineExecutor.StepFailedException e) {
            log.warn(
                    "제작 실패: job={} 단계={} 원인={}",
                    jobId,
                    e.getStepIndex(),
                    e.getCause() == null ? "알 수 없음" : e.getCause().getMessage());
            handleFailure(jobId);

        } catch (RuntimeException e) {
            log.error("제작 중 오류: job={}", jobId, e);
            handleFailure(jobId);
        }
    }

    /**
     * 실패 처리.
     *
     * <p>몇 번은 다시 시도한다. 외부 AI는 일시적으로 실패하는 일이 잦아서, 바로 포기하면 돌려줄
     * 필요가 없었을 프롬비까지 돌려주게 된다. 재시도를 다 쓰면 그때 환불한다.
     */
    private void handleFailure(Long jobId) {
        GenerationJob job = jobs.findById(jobId).orElse(null);
        if (job == null) {
            return;
        }

        if (job.getRetryCount() < MAX_RETRY) {
            state.requeue(jobId);
            log.info("다시 대기열로: job={} 시도={}", jobId, job.getRetryCount() + 1);
            return;
        }

        state.fail(jobId, ErrorCode.GENERATION_FAILED.name());
        refunds.refund(jobId);
    }

    /**
     * 너무 오래 걸리는 작업을 정리한다.
     *
     * <p>워커가 죽거나 외부 제공사가 응답하지 않으면 작업이 진행 중인 채로 남는다. 사용자에게는
     * 영원히 돌아가는 화면이므로, 제한 시간을 넘기면 실패로 마무리하고 돌려준다.
     */
    @Scheduled(fixedDelayString = "${prompick.worker.timeout-sweep-ms:60000}")
    public void sweepStuck() {
        Instant threshold = Instant.now().minus(STUCK_THRESHOLD);
        for (GenerationJob job : jobs.findStuck(threshold)) {
            log.warn("제한 시간 초과로 정리: job={}", job.getId());
            state.fail(job.getId(), ErrorCode.GENERATION_TIMEOUT.name());
            refunds.refund(job.getId());
        }
    }
}
