package com.prompick.admin.api;

import com.prompick.ai.domain.AiModelRepository;
import com.prompick.generation.domain.GenerationJob;
import com.prompick.generation.domain.JobRepository;
import com.prompick.generation.domain.JobStatus;
import com.prompick.template.domain.TemplatePipeline;
import com.prompick.template.domain.TemplatePipelineRepository;
import com.prompick.template.domain.TemplateRepository;
import com.prompick.user.domain.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

/**
 * 운영 현황.
 *
 * <p>이 서비스에서 돈은 두 방향으로 움직인다. 사용자가 낸 프롬비가 들어오고, 외부 AI 요금이
 * 나간다. 둘을 따로 보면 아무것도 알 수 없다 — 제작이 늘었다는 소식이 좋은 소식인지 나쁜
 * 소식인지가 이 둘의 차이로만 갈리기 때문이다.
 *
 * <p>특히 무료 제작은 매출 0에 원가만 나간다. 이 화면이 없으면 무료 사용이 늘어나는 것을
 * "인기가 좋다"고 읽게 되고, 청구서를 받고 나서야 알게 된다.
 */
@RestController
@RequestMapping("/api/v1/admin/operations")
@Tag(name = "관리자 - 운영 현황")
public class AdminOperationsController {

    private final JobRepository jobs;
    private final UserRepository users;
    private final TemplateRepository templates;
    private final TemplatePipelineRepository pipelines;
    private final AiModelRepository models;

    public AdminOperationsController(
            JobRepository jobs,
            UserRepository users,
            TemplateRepository templates,
            TemplatePipelineRepository pipelines,
            AiModelRepository models) {
        this.jobs = jobs;
        this.users = users;
        this.templates = templates;
        this.pipelines = pipelines;
        this.models = models;
    }

    @GetMapping("/summary")
    @Operation(summary = "매출과 원가", description = "기간별로 들어온 프롬비와 나간 AI 요금을 비교한다")
    public Summary summary(@RequestParam(defaultValue = "7") int days) {
        Instant from = Instant.now().minus(Duration.ofDays(days));
        Map<Long, Integer> costByPipeline = pipelineCosts();

        List<GenerationJob> recent = jobs.findAll().stream()
                .filter(job -> job.getCreatedAt() != null && job.getCreatedAt().isAfter(from))
                .toList();

        int paidCount = 0;
        int freeCount = 0;
        int failedCount = 0;
        long revenue = 0;
        long cost = 0;

        for (GenerationJob job : recent) {
            int unitCost = costByPipeline.getOrDefault(job.getPipelineId(), 0);

            // 실패한 작업은 매출이 없다. 환불했기 때문이다. 원가는 이미 나갔을 수도 있지만,
            // 대부분의 실패는 호출 전에 걸리므로 보수적으로 0으로 본다.
            if (job.getStatus() == JobStatus.FAILED) {
                failedCount++;
                continue;
            }
            cost += unitCost;

            if (job.getCreditCostSnapshot() > 0) {
                paidCount++;
                revenue += job.getCreditCostSnapshot();
            } else {
                freeCount++;
            }
        }

        return new Summary(
                days,
                recent.size(),
                paidCount,
                freeCount,
                failedCount,
                revenue,
                cost,
                // 무료 제작에 들어간 원가. 이 숫자가 늘어나는 것은 인기가 아니라 출혈이다.
                (long) freeCount * averageCost(costByPipeline),
                users.count(),
                templates.count());
    }

    @GetMapping("/jobs")
    @Operation(summary = "제작 내역", description = "누가 무엇을 만들었고 얼마가 들었는지")
    public List<JobRow> recentJobs(
            @RequestParam(required = false) JobStatus status,
            @RequestParam(defaultValue = "100") int limit) {

        Map<Long, Integer> costByPipeline = pipelineCosts();
        Map<Long, String> nicknames = new HashMap<>();
        users.findAll().forEach(u -> nicknames.put(u.getId(), u.getNickname()));

        Map<Long, String> titles = new HashMap<>();
        templates.findAll().forEach(t -> titles.put(t.getId(), t.getTitle()));

        return jobs.findAll().stream()
                .filter(job -> status == null || job.getStatus() == status)
                .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                .limit(Math.min(limit, 500))
                .map(job -> new JobRow(
                        job.getId(),
                        job.getUserId(),
                        nicknames.getOrDefault(job.getUserId(), "(없는 사용자)"),
                        titles.getOrDefault(job.getTemplateId(), "(지워진 템플릿)"),
                        job.getStatus().name(),
                        job.getChargeType().name(),
                        job.getCreditCostSnapshot(),
                        costByPipeline.getOrDefault(job.getPipelineId(), 0),
                        job.getErrorCode(),
                        job.getCreatedAt(),
                        job.getFinishedAt()))
                .toList();
    }

    /**
     * 파이프라인 한 번 실행에 드는 원가.
     *
     * <p>단계마다 다른 모델을 쓰므로 단계별 원가를 더한다. 작업마다 다시 계산하면 사용자가
     * 늘었을 때 목록 한 번 여는 데 수백 번 질의하게 되므로 미리 모아 둔다.
     */
    private Map<Long, Integer> pipelineCosts() {
        Map<Long, Integer> unitCosts = new HashMap<>();
        models.findAll().forEach(m -> unitCosts.put(m.getId(), m.getUnitCostKrw()));

        Map<Long, Integer> result = new HashMap<>();
        for (TemplatePipeline pipeline : pipelines.findAll()) {
            int total = 0;
            for (Map<String, Object> step : pipeline.getSteps()) {
                Object modelId = step.get("modelId");
                if (modelId instanceof Number n) {
                    total += unitCosts.getOrDefault(n.longValue(), 0);
                }
            }
            result.put(pipeline.getId(), total);
        }
        return result;
    }

    private static int averageCost(Map<Long, Integer> costs) {
        return costs.isEmpty()
                ? 0
                : (int) costs.values().stream().mapToInt(Integer::intValue).average().orElse(0);
    }

    /**
     * @param revenue 받은 프롬비 합계
     * @param providerCost 외부 AI에 나간 원가 합계(원)
     * @param freeCost 그중 무료 제작에 들어간 원가. 매출 없이 나간 돈이다
     */
    public record Summary(
            int days,
            int totalJobs,
            int paidJobs,
            int freeJobs,
            int failedJobs,
            long revenue,
            long providerCost,
            long freeCost,
            long totalUsers,
            long totalTemplates) {}

    public record JobRow(
            Long id,
            Long userId,
            String nickname,
            String templateTitle,
            String status,
            String chargeType,
            int creditCost,
            int providerCost,
            String errorCode,
            Instant createdAt,
            Instant finishedAt) {}
}
