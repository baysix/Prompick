package com.prompick.admin.api;

import com.prompick.generation.domain.JobRepository;
import com.prompick.generation.domain.JobStatus;
import com.prompick.settings.app.ServiceStatusService;
import com.prompick.user.api.CurrentUser;
import com.prompick.user.domain.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import org.springframework.web.bind.annotation.*;

/**
 * 배포 준비.
 *
 * <p>배포는 서버를 껐다 켜는 일이고, 그때 제작 중이던 작업은 끊긴다. 끊긴 작업은 10분 뒤
 * 다시 집혀 <b>처음 단계부터</b> 다시 돌아간다 — 이미 낸 AI 요금을 한 번 더 내는 셈이다.
 *
 * <p>그래서 배포 전에 여기서 잠그고, 돌고 있는 작업이 다 끝난 것을 확인한 뒤에 배포한다.
 * 확인할 수 없으면 잠그는 의미가 없으므로 대기·진행 건수를 같이 돌려준다.
 */
@RestController
@RequestMapping("/api/v1/admin/service-status")
@Tag(name = "관리자 - 배포 준비")
public class AdminServiceStatusController {

    private final ServiceStatusService serviceStatus;
    private final JobRepository jobs;

    public AdminServiceStatusController(ServiceStatusService serviceStatus, JobRepository jobs) {
        this.serviceStatus = serviceStatus;
        this.jobs = jobs;
    }

    @GetMapping
    @Operation(summary = "현재 상태", description = "잠금 여부와 남은 작업 수. 둘 다 0이어야 배포할 수 있다")
    public StatusResponse status() {
        return describe(serviceStatus.current());
    }

    @PostMapping("/lock")
    @Operation(
            summary = "제작 잠그기",
            description = "이 순간부터 새 제작을 받지 않는다. 이미 돌고 있는 작업은 그대로 끝까지 간다")
    public StatusResponse lock(@CurrentUser User admin, @RequestBody(required = false) LockForm form) {
        String message = form == null ? null : form.message();
        return describe(serviceStatus.lock(message, admin.getId()));
    }

    @PostMapping("/unlock")
    @Operation(summary = "제작 다시 열기", description = "배포가 끝난 뒤에 누른다")
    public StatusResponse unlock(@CurrentUser User admin) {
        return describe(serviceStatus.unlock(admin.getId()));
    }

    private StatusResponse describe(ServiceStatusService.GenerationLock lock) {
        long queued = jobs.countByStatus(JobStatus.QUEUED);
        long running = jobs.countByStatus(JobStatus.RUNNING);

        return new StatusResponse(
                lock.locked(),
                lock.message(),
                lock.since(),
                queued,
                running,
                // 잠그지 않은 채 대기열만 비어 있는 것은 아무 의미가 없다. 다음 순간 새 작업이
                // 들어올 수 있기 때문이다. 셋이 모두 맞을 때만 배포해도 된다고 말한다.
                lock.locked() && queued == 0 && running == 0);
    }

    /** @param message 사용자에게 보여줄 사유. 비워두면 기본 문구를 쓴다 */
    public record LockForm(@Size(max = 200) String message) {}

    /**
     * @param queuedJobs 아직 시작하지 않은 작업. 잠근 뒤에는 늘지 않는다
     * @param runningJobs 지금 AI를 호출하고 있는 작업. 늦어도 20분 안에 0이 된다
     * @param safeToDeploy 지금 배포해도 잃어버리는 작업이 없는지
     */
    public record StatusResponse(
            boolean locked,
            String message,
            Instant lockedAt,
            long queuedJobs,
            long runningJobs,
            boolean safeToDeploy) {}
}
