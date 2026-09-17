package com.prompick.admin.api;

import com.prompick.admin.api.dto.AiModelResponse;
import com.prompick.ai.domain.AiModelRepository;
import com.prompick.ai.domain.Capability;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

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
}
