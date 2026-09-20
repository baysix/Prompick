package com.prompick.admin.api;

import com.prompick.credit.app.CreditService;
import com.prompick.credit.domain.CreditReason;
import com.prompick.credit.domain.CreditTransaction;
import com.prompick.credit.domain.CreditTransactionRepository;
import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.generation.app.FreeUsageService;
import com.prompick.generation.domain.*;
import com.prompick.template.domain.TemplateRepository;
import com.prompick.user.domain.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.ZoneId;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * 제작 한 건을 자세히 보고, 필요하면 돌려준다.
 *
 * <p>환불을 결정하려면 세 가지를 같이 봐야 한다 — 정말 실패했는지, 얼마를 받았는지, 이미 돌려준
 * 적이 있는지. 이 셋이 한 화면에 없으면 운영자는 추측으로 판단하게 되고, 추측은 대개 사용자에게
 * 유리한 쪽으로 기울어 이중 지급으로 끝난다.
 *
 * <p>가장 중요한 것은 <b>이미 돌려줬는지</b>다. 실패한 작업은 시스템이 자동으로 환불하므로,
 * 운영자가 그 사실을 모르고 한 번 더 주면 두 배가 나간다. 그래서 이 화면은 환불 기록을 먼저
 * 보여주고, 이미 있으면 버튼을 막는다.
 */
@RestController
@RequestMapping("/api/v1/admin/operations/jobs")
@Tag(name = "관리자 - 제작 상세")
public class AdminJobDetailController {

    private final JobRepository jobs;
    private final JobStepRepository steps;
    private final OutputRepository outputs;
    private final UserRepository users;
    private final TemplateRepository templates;
    private final CreditService credits;
    private final CreditTransactionRepository transactions;
    private final FreeUsageService freeUsage;

    public AdminJobDetailController(
            JobRepository jobs,
            JobStepRepository steps,
            OutputRepository outputs,
            UserRepository users,
            TemplateRepository templates,
            CreditService credits,
            CreditTransactionRepository transactions,
            FreeUsageService freeUsage) {
        this.jobs = jobs;
        this.steps = steps;
        this.outputs = outputs;
        this.users = users;
        this.templates = templates;
        this.credits = credits;
        this.transactions = transactions;
        this.freeUsage = freeUsage;
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "제작 한 건의 전체 기록",
            description = "단계별 실패 원인과 프롬비 흐름을 함께 준다. 환불 판단에 필요한 것이 전부 여기 있다")
    @Transactional(readOnly = true)
    public JobDetail detail(@PathVariable Long id) {
        GenerationJob job = jobs.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        List<StepRow> stepRows = steps.findByJobIdOrderByStepIndexAsc(id).stream()
                .map(s -> new StepRow(
                        s.getStepIndex(),
                        s.getStatus().name(),
                        // 실패 원인 원문. 관리자만 본다 — 모델 이름이 섞여 있을 수 있다.
                        s.getErrorDetail(),
                        s.getStartedAt(),
                        s.getFinishedAt()))
                .toList();

        // 이 작업에 얽힌 프롬비 움직임. 차감과 환불이 짝을 이루는지 여기서 보인다.
        List<MoneyRow> money = transactions.findByUserIdOrderByIdDesc(
                        job.getUserId(), org.springframework.data.domain.PageRequest.of(0, 200)).stream()
                .filter(t -> "JOB".equals(t.getRefType()) && id.equals(t.getRefId()))
                .map(AdminJobDetailController::toMoneyRow)
                .toList();

        boolean alreadyRefunded = money.stream().anyMatch(m -> "REFUND".equals(m.reason()));
        boolean paid = job.getChargeType() == ChargeType.PAID && job.getCreditCostSnapshot() > 0;

        return new JobDetail(
                job.getId(),
                job.getUserId(),
                users.findById(job.getUserId()).map(u -> u.getNickname()).orElse("(없는 사용자)"),
                templates.findById(job.getTemplateId()).map(t -> t.getTitle()).orElse("(지워진 템플릿)"),
                job.getStatus().name(),
                job.getChargeType().name(),
                job.getCreditCostSnapshot(),
                job.getErrorCode(),
                job.getRetryCount(),
                job.getCreatedAt(),
                job.getFinishedAt(),
                outputs.findByJobIdAndDeletedAtIsNull(id).size(),
                stepRows,
                money,
                alreadyRefunded,
                refundabilityOf(job, paid, alreadyRefunded));
    }

    @PostMapping("/{id}/refund")
    @Operation(
            summary = "직접 돌려주기",
            description = "이미 돌려준 작업은 거절한다. 사유를 반드시 남긴다")
    @Transactional
    public JobDetail refund(
            @PathVariable Long id,
            @Valid @RequestBody RefundRequest request,
            Authentication authentication) {

        GenerationJob job = jobs.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        String actor = authentication == null ? "unknown" : authentication.getName();

        boolean alreadyRefunded =
                transactions.findByUserIdOrderByIdDesc(
                        job.getUserId(), org.springframework.data.domain.PageRequest.of(0, 200)).stream()
                        .anyMatch(t -> "JOB".equals(t.getRefType())
                                && id.equals(t.getRefId())
                                && t.getReason() == CreditReason.REFUND);

        // 자동 환불이 이미 나갔는데 또 주면 두 배가 나간다. 여기서 막지 않으면 아무도 못 막는다.
        if (alreadyRefunded) {
            throw new ApiException(
                    ErrorCode.INVALID_REQUEST, "이미 돌려준 작업이에요. 프롬비 내역을 확인해주세요.");
        }

        if (job.getChargeType() == ChargeType.FREE) {
            // 무료 제작은 돌려줄 프롬비가 없다. 대신 오늘 쓴 횟수를 되돌린다.
            freeUsage.restore(
                    job.getUserId(),
                    job.getCreatedAt().atZone(ZoneId.of("Asia/Seoul")).toLocalDate());
        } else {
            int amount = job.getCreditCostSnapshot();
            if (amount <= 0) {
                throw new ApiException(ErrorCode.INVALID_REQUEST, "돌려줄 프롬비가 없어요.");
            }
            credits.give(
                    job.getUserId(), amount, CreditReason.REFUND, "JOB", id, actor, request.reason());
        }
        return detail(id);
    }

    /**
     * 돌려줄 수 있는 상태인지, 아니라면 왜인지.
     *
     * <p>버튼을 막기만 하고 이유를 말하지 않으면 운영자는 시스템이 고장났다고 생각한다.
     */
    private static Refundability refundabilityOf(
            GenerationJob job, boolean paid, boolean alreadyRefunded) {

        if (alreadyRefunded) {
            return new Refundability(false, "이미 돌려줬어요");
        }
        if (job.getStatus() == JobStatus.QUEUED || job.getStatus() == JobStatus.RUNNING) {
            return new Refundability(false, "아직 진행 중이에요");
        }
        if (job.getChargeType() == ChargeType.FREE) {
            return new Refundability(true, "무료 제작이에요. 오늘 쓴 횟수를 되돌려요");
        }
        if (!paid) {
            return new Refundability(false, "받은 프롬비가 없어요");
        }
        if (job.getStatus() == JobStatus.SUCCEEDED) {
            // 막지는 않는다. 결과가 마음에 안 든다는 이유로는 환불하지 않는 것이 원칙이지만,
            // 예외를 둘지는 사람이 판단할 일이다. 다만 원칙과 다르다는 것은 알려준다.
            return new Refundability(true, "성공한 작업이에요. 결과 불만족은 환불 대상이 아니에요");
        }
        return new Refundability(true, "실패한 작업이에요");
    }

    private static MoneyRow toMoneyRow(CreditTransaction t) {
        return new MoneyRow(
                t.getId(),
                t.getAmount(),
                t.getBalanceAfter(),
                t.getReason().name(),
                t.getReason().displayName(),
                t.getActor(),
                t.getMemo(),
                t.getCreatedAt());
    }

    public record RefundRequest(
            @NotBlank(message = "돌려주는 이유를 적어주세요") @Size(max = 300) String reason) {}

    /**
     * @param alreadyRefunded 이미 돌려준 적이 있는지. 이중 지급을 막는 가장 중요한 값이다
     */
    public record JobDetail(
            Long id,
            Long userId,
            String nickname,
            String templateTitle,
            String status,
            String chargeType,
            int creditCost,
            String errorCode,
            int retryCount,
            Instant createdAt,
            Instant finishedAt,
            int outputCount,
            List<StepRow> steps,
            List<MoneyRow> money,
            boolean alreadyRefunded,
            Refundability refundable) {}

    /** @param errorDetail 실패 원문. 관리자만 본다 */
    public record StepRow(
            int index, String status, String errorDetail, Instant startedAt, Instant finishedAt) {}

    public record MoneyRow(
            Long id,
            int amount,
            int balanceAfter,
            String reason,
            String reasonLabel,
            String actor,
            String memo,
            Instant createdAt) {}

    public record Refundability(boolean allowed, String note) {}
}
