package com.prompick.generation.app;

import com.prompick.generation.domain.ChargeType;
import com.prompick.generation.domain.GenerationJob;
import com.prompick.generation.domain.JobRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 제작이 실패했을 때 되돌린다.
 *
 * <p>무료였으면 오늘 쓴 횟수를 되돌리고, 유료였으면 프롬비를 돌려준다. 실패했는데 돌려주지
 * 않으면 사용자는 아무것도 못 받고 값만 치른 셈이 된다 — 신뢰를 잃는 가장 빠른 길이다.
 *
 * <p>차감 시점의 날짜로 되돌린다. 자정을 넘겨 실패한 경우 오늘 치를 깎으면, 어제 쓴 횟수는
 * 그대로 남고 오늘 횟수만 줄어든다.
 */
@Service
public class JobRefundService {

    private static final Logger log = LoggerFactory.getLogger(JobRefundService.class);

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final JobRepository jobs;
    private final FreeUsageService freeUsage;

    public JobRefundService(JobRepository jobs, FreeUsageService freeUsage) {
        this.jobs = jobs;
        this.freeUsage = freeUsage;
    }

    /**
     * 되돌린다.
     *
     * <p>바깥 트랜잭션과 분리한다. 실패를 기록하는 쪽에서 문제가 생겨도 환불은 남아야 한다.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void refund(Long jobId) {
        GenerationJob job = jobs.findById(jobId).orElse(null);
        if (job == null) {
            return;
        }

        if (job.getChargeType() == ChargeType.FREE) {
            LocalDate chargedOn = chargedDate(job);
            freeUsage.restore(job.getUserId(), chargedOn);
            log.info("무료 횟수 복구: job={} user={} date={}", jobId, job.getUserId(), chargedOn);
            return;
        }

        // 프롬비 환불은 지갑이 붙는 5단계에서 연결한다. 지금은 유료 제작 자체를 막아 두었다.
        log.info("프롬비 환불 대상: job={} 금액={}", jobId, job.getCreditCostSnapshot());
    }

    /** 차감이 일어난 날짜(KST). 자정을 넘겨 실패해도 맞는 날짜를 되돌린다. */
    private LocalDate chargedDate(GenerationJob job) {
        var createdAt = job.getCreatedAt();
        return createdAt == null ? freeUsage.today() : createdAt.atZone(KST).toLocalDate();
    }
}
