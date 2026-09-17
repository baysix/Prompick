package com.prompick.admin.api;

import com.prompick.admin.api.dto.AiModelResponse;
import com.prompick.ai.domain.AiModel;
import com.prompick.ai.domain.AiModelRepository;
import com.prompick.ai.domain.Capability;
import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.PositiveOrZero;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * AI 모델 목록. 관리자가 파이프라인 단계를 만들 때 고를 후보를 내려준다.
 *
 * <p>사용자 화면에는 이 정보가 전혀 나가지 않는다.
 */
@RestController
@RequestMapping("/api/v1/admin/ai-models")
@Tag(name = "관리자 - AI 모델")
public class AdminAiModelController {

    private final AiModelRepository models;

    public AdminAiModelController(AiModelRepository models) {
        this.models = models;
    }

    @GetMapping
    @Operation(
            summary = "AI 모델 목록",
            description = "capability를 주면 그 단계에 쓸 수 있는 모델만 내려준다")
    public List<AiModelResponse> list(
            @RequestParam(required = false) Capability capability,
            @RequestParam(defaultValue = "true") boolean activeOnly) {

        var found = capability != null
                ? models.findByActiveTrueAndCapabilityOrderBySortOrderAscIdAsc(capability)
                : activeOnly
                        ? models.findByActiveTrueOrderBySortOrderAscIdAsc()
                        : models.findByOrderBySortOrderAscIdAsc();

        return found.stream().map(AiModelResponse::from).toList();
    }

    @PatchMapping("/{id}")
    @Operation(
            summary = "모델 사용 설정",
            description = "약관을 확인하고 API 키를 넣은 뒤 켠다. 꺼진 모델은 파이프라인에서 고를 수 없다")
    @Transactional
    public AiModelResponse configure(@PathVariable Long id, @RequestBody ConfigureRequest request) {
        AiModel model = models.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        model.configure(
                request.active(),
                request.unitCostKrw() == null ? model.getUnitCostKrw() : request.unitCostKrw(),
                request.memo() == null ? model.getMemo() : request.memo());
        return AiModelResponse.from(model);
    }

    public record ConfigureRequest(
            boolean active, @PositiveOrZero Integer unitCostKrw, String memo) {}
}
