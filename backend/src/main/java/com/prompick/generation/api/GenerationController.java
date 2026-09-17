package com.prompick.generation.api;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.generation.api.dto.JobResponse;
import com.prompick.generation.app.FreeUsageService;
import com.prompick.generation.app.JobQueryService;
import com.prompick.generation.app.JobService;
import com.prompick.generation.app.UploadService;
import com.prompick.generation.domain.GenerationJob;
import com.prompick.generation.domain.JobStatus;
import com.prompick.generation.domain.Upload;
import com.prompick.user.api.CurrentUser;
import com.prompick.user.domain.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

/**
 * 업로드와 제작. 로그인이 필요하다.
 *
 * <p>응답 어디에도 파이프라인 정보가 없다. 진행 상황은 단계 번호와 일반 문구로만 알려준다.
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "제작")
public class GenerationController {

    private final UploadService uploads;
    private final JobService jobService;
    private final JobQueryService jobQuery;
    private final FreeUsageService freeUsage;

    public GenerationController(
            UploadService uploads,
            JobService jobService,
            JobQueryService jobQuery,
            FreeUsageService freeUsage) {
        this.uploads = uploads;
        this.jobService = jobService;
        this.jobQuery = jobQuery;
        this.freeUsage = freeUsage;
    }

    @PostMapping("/uploads/presign")
    @Operation(
            summary = "사진 업로드 주소 발급",
            description = "받은 주소로 파일을 직접 올린 뒤 검사를 요청한다. 파일은 백엔드를 거치지 않는다")
    public UploadService.PresignResult presign(
            @CurrentUser User user, @Valid @RequestBody PresignRequest request) {
        return uploads.presign(user.getId(), request.fileName(), request.contentType());
    }

    @PostMapping("/uploads/{uploadId}/check")
    @Operation(summary = "업로드 검사", description = "형식·용량·크기를 확인한다")
    public UploadService.CheckResult check(
            @CurrentUser User user,
            @PathVariable Long uploadId,
            @RequestBody(required = false) CheckRequest request) {
        return uploads.check(
                user.getId(),
                uploadId,
                request == null ? null : request.minWidth(),
                request == null ? null : request.minHeight());
    }

    @PostMapping("/jobs")
    @Operation(
            summary = "제작 요청",
            description = "작업을 만들어두고 바로 응답한다. 실제 제작은 서버가 이어서 진행한다")
    public JobResponse create(
            @CurrentUser User user,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyKey,
            @Valid @RequestBody CreateJobRequest request) {

        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "Idempotency-Key 헤더가 필요해요.");
        }

        GenerationJob job = jobService.request(
                user, request.templateSlug(), request.inputs() == null ? Map.of() : request.inputs(),
                idempotencyKey);

        return jobQuery.get(user.getId(), job.getId());
    }

    @GetMapping("/jobs")
    @Operation(summary = "내 작업 목록")
    public List<JobResponse> list(
            @CurrentUser User user,
            @RequestParam(required = false) JobStatus status,
            @RequestParam(defaultValue = "30") int size) {
        return jobQuery.list(user.getId(), status, Math.clamp(size, 1, 100));
    }

    @GetMapping("/jobs/{jobId}")
    @Operation(summary = "작업 상태·결과", description = "완료되기 전까지 화면이 이 응답을 반복해서 확인한다")
    public JobResponse get(@CurrentUser User user, @PathVariable Long jobId) {
        return jobQuery.get(user.getId(), jobId);
    }

    @DeleteMapping("/jobs/{jobId}/outputs")
    @Operation(summary = "결과물 삭제", description = "파일까지 지운다")
    public void deleteOutputs(@CurrentUser User user, @PathVariable Long jobId) {
        jobQuery.deleteOutputs(user.getId(), jobId);
    }

    @GetMapping("/me/free-usage")
    @Operation(summary = "오늘 남은 무료 제작 횟수")
    public FreeUsageResponse freeUsage(@CurrentUser User user) {
        return new FreeUsageResponse(
                freeUsage.remaining(user.getId()),
                freeUsage.dailyLimit(),
                user.isIdentityVerified());
    }

    public record PresignRequest(
            @NotBlank(message = "파일 이름이 필요해요") String fileName,
            @NotBlank(message = "파일 형식이 필요해요") String contentType) {}

    public record CheckRequest(Integer minWidth, Integer minHeight) {}

    public record CreateJobRequest(
            @NotBlank(message = "템플릿을 골라주세요") String templateSlug,
            /** 입력 필드 키 → 값. 사진은 업로드 id를 넣는다 */
            Map<String, Object> inputs) {}

    public record FreeUsageResponse(int remaining, int dailyLimit, boolean identityVerified) {}

    /** 업로드 검사 결과를 화면이 읽기 쉬운 형태로 */
    public record UploadCheckView(Long uploadId, Upload.CheckStatus status, Map<String, Object> messages) {}
}
