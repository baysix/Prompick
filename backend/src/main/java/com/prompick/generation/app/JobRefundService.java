package com.prompick.generation.app;

import com.prompick.credit.app.CreditService;
import com.prompick.credit.domain.CreditReason;
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

    private final CreditService credits;

    private static final Logger log = LoggerFactory.getLogger(JobRefundService.class);

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final JobRepository jobs;
    private final FreeUsageService freeUsage;

    public JobRefundService(JobRepository jobs, FreeUsageService freeUsage, CreditService credits) {
        this.credits = credits;
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

        int cost = job.getCreditCostSnapshot();
        if (cost <= 0) {
            return;
        }
        // 쓴 만큼 그대로 돌려준다. 어느 작업 때문인지 장부에 남겨, 사용자가 내역에서 짝을 볼 수 있게 한다.
        credits.give(job.getUserId(), cost, CreditReason.REFUND, "JOB", jobId, null, "제작 실패 환불");
        log.info("프롬비 환불: job={} user={} 금액={}", jobId, job.getUserId(), cost);
    }

    /** 차감이 일어난 날짜(KST). 자정을 넘겨 실패해도 맞는 날짜를 되돌린다. */
    private LocalDate chargedDate(GenerationJob job) {
        var createdAt = job.getCreatedAt();
        return createdAt == null ? freeUsage.today() : createdAt.atZone(KST).toLocalDate();
    }
}
