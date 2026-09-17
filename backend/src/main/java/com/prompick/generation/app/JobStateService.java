package com.prompick.generation.app;

import com.prompick.generation.domain.GenerationJob;
import com.prompick.generation.domain.JobRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 작업 상태를 바꾸는 일만 담당한다.
 *
 * <p>워커와 분리한 이유: 같은 클래스 안에서 {@code @Transactional} 메서드를 호출하면 프록시를
 * 거치지 않아 트랜잭션이 걸리지 않는다. 트랜잭션이 없으면 변경 감지도 일어나지 않아서, 잠금을
 * 걸어도 저장되지 않고 작업이 영원히 대기 상태로 남는다.
 *
 * <p>상태 변경을 짧은 트랜잭션으로 끊어두는 이유도 있다. 제작은 몇 분이 걸리는데 그동안
 * 트랜잭션을 열어두면 DB 커넥션이 묶인다.
 */
@Service
public class JobStateService {

    private final JobRepository jobs;

    public JobStateService(JobRepository jobs) {
        this.jobs = jobs;
    }

    /**
     * 대기 중인 작업을 집어 들고 잠근다.
     *
     * @return 집어 든 작업의 id
     */
    @Transactional
    public List<Long> pickUp(String workerId, int batchSize, Duration lockDuration) {
        List<GenerationJob> found = jobs.pickUp(batchSize);
        Instant until = Instant.now().plus(lockDuration);
        found.forEach(job -> job.lock(workerId, until));
        return found.stream().map(GenerationJob::getId).toList();
    }

    @Transactional
    public void succeed(Long jobId) {
        jobs.findById(jobId).ifPresent(GenerationJob::succeed);
    }

    @Transactional
    public void fail(Long jobId, String errorCode) {
        jobs.findById(jobId).ifPresent(job -> job.fail(errorCode));
    }

    @Transactional
    public void requeue(Long jobId) {
        jobs.findById(jobId).ifPresent(GenerationJob::requeue);
    }

    /** 실행 중 진행 단계를 갱신한다. 사용자 화면의 진행률이 여기서 움직인다. */
    @Transactional
    public void advance(Long jobId, int stepIndex) {
        jobs.findById(jobId).ifPresent(job -> job.advanceTo(stepIndex));
    }
}
