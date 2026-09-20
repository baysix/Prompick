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
    private final com.prompick.template.domain.TemplateInputFieldRepository inputFields;

    public PipelineAdminService(TemplatePipelineRepository pipelines,
            TemplateRepository templates,
            AiModelRepository models,
            com.prompick.template.domain.TemplateInputFieldRepository inputFields) {
        this.inputFields = inputFields;
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

        // 돌아갈 버전이 정해졌을 때만 사진 칸을 맞춘다. 저장만 해두는 초안 때문에 사용자가
        // 보는 업로드 칸이 바뀌면 안 된다.
        if (request.activate()) {
            syncPhotoFields(templateId, steps);
        }

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

    /**
     * 이 템플릿이 받는 입력 칸 목록.
     *
     * <p>파이프라인 편집기가 프롬프트의 {@code @이름}에 무엇을 이을지 고르게 하려고 쓴다.
     * 사진 칸과 그 밖의 칸을 구분해서 준다 — 사진은 파일로 실리고, 나머지는 프롬프트 변수로
     * 치환되어 성격이 다르다.
     */
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public java.util.List<com.prompick.admin.api.AdminPipelineController.InputFieldOption>
            inputFieldsOf(Long templateId) {

        return templates
                .findById(templateId)
                .map(t -> t.getInputFields().stream()
                        .map(f -> new com.prompick.admin.api.AdminPipelineController.InputFieldOption(
                                f.getFieldKey(),
                                f.getLabel(),
                                f.getFieldType() == com.prompick.template.domain.TemplateInputField.FieldType.IMAGE))
                        .toList())
                .orElse(java.util.List.of());
    }


    /**
     * 지시문이 부르는 사진에 맞춰 업로드 칸을 만든다.
     *
     * <p>운영자는 지시문에 {@code @아이사진} 이라고 적고 설명만 달면 된다. 사용자가 보는 업로드
     * 칸은 여기서 자동으로 만들어진다. 같은 것을 두 군데에 적게 하면 언젠가 어긋나고, 어긋나면
     * 사진이 전달되지 않은 채 글만으로 만들어져 오류 없이 엉뚱한 결과가 나온다.
     *
     * <p>이미 있는 칸은 지우지 않고 설명만 고친다. 지웠다 다시 만들면 id가 바뀌는데, 진행 중인
     * 작업이 그 id를 가리키고 있을 수 있다.
     */
    private void syncPhotoFields(Long templateId, List<Map<String, Object>> steps) {
        // 지시문에 나온 차례대로 모은다. 그 차례가 곧 업로드 칸의 차례가 된다.
        Map<String, String> wanted = new LinkedHashMap<>();

        for (Map<String, Object> step : steps) {
            Object prompt = step.get("prompt");
            Object inputs = step.get("inputs");
            if (!(prompt instanceof String text) || !(inputs instanceof Map<?, ?> map)) {
                continue;
            }
            for (String token : com.prompick.generation.app.PhotoReferences.tokensIn(text)) {
                Object description = map.get(token);
                // 앞 단계 결과를 가리키는 것은 사용자가 올리는 사진이 아니다.
                if (description instanceof String d && d.startsWith("steps[")) {
                    continue;
                }
                wanted.putIfAbsent(
                        token.substring(1),
                        description instanceof String d && !d.isBlank() ? d : token.substring(1));
            }
        }

        List<com.prompick.template.domain.TemplateInputField> existing =
                inputFields.findByTemplateIdOrderBySortOrderAscIdAsc(templateId);

        Map<String, com.prompick.template.domain.TemplateInputField> byKey = new LinkedHashMap<>();
        existing.forEach(f -> byKey.put(f.getFieldKey(), f));

        int order = 0;
        for (Map.Entry<String, String> entry : wanted.entrySet()) {
            String key = entry.getKey();
            String description = entry.getValue();
            order++;

            var found = byKey.get(key);
            if (found != null) {
                found.describe(key, description, order);
                inputFields.save(found);
            } else {
                inputFields.save(com.prompick.template.domain.TemplateInputField.photoFor(
                        templateId, key, key, description, order));
            }
        }

        // 더 이상 부르지 않는 사진 칸은 치운다. 남겨두면 사용자가 쓰이지도 않는 사진을 올린다.
        existing.stream()
                .filter(f -> f.getFieldType() == com.prompick.template.domain.TemplateInputField.FieldType.IMAGE)
                .filter(f -> !wanted.containsKey(f.getFieldKey()))
                .forEach(inputFields::delete);
    }

}
