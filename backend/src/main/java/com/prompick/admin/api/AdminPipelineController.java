package com.prompick.admin.api;

import com.prompick.admin.api.dto.PipelineRequest;
import com.prompick.admin.api.dto.PipelineResponse;
import com.prompick.admin.app.PipelineAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.*;

/**
 * 파이프라인 관리. 관리자 전용.
 *
 * <p>여기서 반환하는 {@link PipelineResponse}에는 내부 프롬프트와 모델명이 들어 있다.
 * 이 컨트롤러의 경로는 {@code /admin/**}이며 사용자 토큰으로는 접근할 수 없다.
 */
@RestController
@RequestMapping("/api/v1/admin/templates/{templateId}/pipelines")
@Tag(name = "관리자 - 파이프라인")
public class AdminPipelineController {

    private final PipelineAdminService service;

    public AdminPipelineController(PipelineAdminService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "버전 목록", description = "단계별 사용 모델과 원가 합계를 함께 보여준다")
    public List<PipelineResponse> list(@PathVariable Long templateId) {
        return service.list(templateId);
    }

    @PostMapping
    @Operation(
            summary = "새 버전 만들기",
            description = "기존 버전을 고치지 않고 새 버전을 추가한다. 단계마다 사용할 AI를 지정한다")
    public PipelineResponse create(
            @PathVariable Long templateId, @Valid @RequestBody PipelineRequest request) {
        return service.createVersion(templateId, request);
    }

    @PostMapping("/{pipelineId}/activate")
    @Operation(summary = "이 버전을 활성화", description = "이전 버전으로 되돌릴 때 쓴다")
    public PipelineResponse activate(@PathVariable Long templateId, @PathVariable Long pipelineId) {
        return service.activate(templateId, pipelineId);
    }
}
