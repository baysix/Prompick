package com.prompick.admin.app;

import com.prompick.admin.api.dto.PipelineRequest;
import com.prompick.admin.api.dto.PipelineResponse;
import com.prompick.ai.domain.AiModel;
import com.prompick.ai.domain.AiModelRepository;
import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.template.domain.TemplatePipeline;
import com.prompick.template.domain.TemplatePipelineRepository;
import com.prompick.template.domain.TemplateRepository;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 파이프라인 관리. 관리자 전용.
 *
 * <p>수정은 덮어쓰지 않고 새 버전을 만든다. 진행 중인 작업이 요청 시점 버전으로 끝까지 실행되게 하기 위해서다.
 */
@Service
@Transactional
public class PipelineAdminService {

    private final TemplatePipelineRepository pipelines;
    private final TemplateRepository templates;
    private final AiModelRepository models;

    public PipelineAdminService(
            TemplatePipelineRepository pipelines,
            TemplateRepository templates,
            AiModelRepository models) {
        this.pipelines = pipelines;
        this.templates = templates;
        this.models = models;
    }

    @Transactional(readOnly = true)
    public List<PipelineResponse> list(Long templateId) {
        List<TemplatePipeline> found = pipelines.findByTemplateIdOrderByVersionDesc(templateId);
        Map<Long, AiModel> modelMap = modelMap();
        return found.stream().map(p -> toResponse(p, modelMap)).toList();
    }

    /** 새 버전을 만든다. 기존 버전은 남는다. */
    public PipelineResponse createVersion(Long templateId, PipelineRequest request) {
        if (!templates.existsById(templateId)) {
            throw new ApiException(ErrorCode.NOT_FOUND);
        }

        Map<Long, AiModel> modelMap = modelMap();
        List<Map<String, Object>> steps = new ArrayList<>();

        for (PipelineRequest.Step step : request.steps()) {
            AiModel model = modelMap.get(step.modelId());
            if (model == null) {
                throw new ApiException(ErrorCode.INVALID_REQUEST, "등록되지 않은 AI 모델이에요.");
            }
            if (!model.isActive()) {
                throw new ApiException(
                        ErrorCode.INVALID_REQUEST, "사용 중지된 모델이에요: " + model.getDisplayName());
            }

            // JSONB에 저장할 형태로 바꾼다. 키 순서를 유지해 관리자가 읽기 쉽게 한다.
            Map<String, Object> raw = new LinkedHashMap<>();
            raw.put("type", step.type());
            raw.put("modelId", step.modelId());
            if (step.prompt() != null) {
                raw.put("prompt", step.prompt());
            }
            raw.put("params", step.params() == null ? Map.of() : step.params());
            raw.put("inputs", step.inputs() == null ? Map.of() : step.inputs());
            steps.add(raw);
        }

        int nextVersion = pipelines.findMaxVersion(templateId) + 1;

        // 활성 버전은 하나뿐이므로, 새로 활성화하기 전에 기존 것을 내린다.
        if (request.activate()) {
            pipelines.findByTemplateIdAndActiveTrue(templateId).ifPresent(TemplatePipeline::deactivate);
            pipelines.flush();
        }

        TemplatePipeline saved = pipelines.save(new TemplatePipeline(
                templateId, nextVersion, request.activate(), steps, request.adminMemo()));

        return toResponse(saved, modelMap);
    }

    /** 이전 버전으로 되돌린다. */
    public PipelineResponse activate(Long templateId, Long pipelineId) {
        TemplatePipeline target = pipelines
                .findById(pipelineId)
                .filter(p -> p.getTemplateId().equals(templateId))
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        pipelines.findByTemplateIdAndActiveTrue(templateId).ifPresent(TemplatePipeline::deactivate);
        pipelines.flush();
        target.activate();

        return toResponse(target, modelMap());
    }

    private Map<Long, AiModel> modelMap() {
        return models.findAll().stream().collect(Collectors.toMap(AiModel::getId, Function.identity()));
    }

    private PipelineResponse toResponse(TemplatePipeline p, Map<Long, AiModel> modelMap) {
        List<PipelineResponse.StepView> views = new ArrayList<>();
        int totalCost = 0;

        List<Map<String, Object>> steps = p.getSteps();
        for (int i = 0; i < steps.size(); i++) {
            Map<String, Object> step = steps.get(i);
            Long modelId = asLong(step.get("modelId"));
            AiModel model = modelId == null ? null : modelMap.get(modelId);
            if (model != null) {
                totalCost += model.getUnitCostKrw();
            }

            views.add(new PipelineResponse.StepView(
                    i,
                    (String) step.get("type"),
                    modelId,
                    model == null ? null : model.getProvider().name(),
                    model == null ? "(삭제된 모델)" : model.getDisplayName(),
                    model == null ? 0 : model.getUnitCostKrw(),
                    (String) step.get("prompt"),
                    castMap(step.get("params")),
                    castStringMap(step.get("inputs"))));
        }

        return new PipelineResponse(
                p.getId(), p.getTemplateId(), p.getVersion(), p.isActive(), views, p.getAdminMemo(), totalCost);
    }

    private static Long asLong(Object value) {
        return value instanceof Number n ? n.longValue() : null;
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> castMap(Object value) {
        return value instanceof Map<?, ?> m ? (Map<String, Object>) m : Map.of();
    }

    @SuppressWarnings("unchecked")
    private static Map<String, String> castStringMap(Object value) {
        return value instanceof Map<?, ?> m ? (Map<String, String>) m : Map.of();
    }
}
