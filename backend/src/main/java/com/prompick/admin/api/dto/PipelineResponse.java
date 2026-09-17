package com.prompick.admin.api.dto;

import java.util.List;
import java.util.Map;

/**
 * 파이프라인 응답. <b>관리자 전용.</b>
 *
 * <p>이 클래스는 절대 사용자용 컨트롤러에서 반환하지 않는다. 패키지가 {@code admin}인 이유다.
 */
public record PipelineResponse(
        Long id,
        Long templateId,
        int version,
        boolean active,
        List<StepView> steps,
        String adminMemo,
        /** 이 파이프라인 1회 실행에 드는 외부 API 원가 합계(원) */
        int estimatedCostKrw) {

    /** 단계 + 그 단계가 쓰는 모델 정보를 함께 보여준다 */
    public record StepView(
            int index,
            String type,
            Long modelId,
            String modelProvider,
            String modelDisplayName,
            int modelUnitCostKrw,
            String prompt,
            Map<String, Object> params,
            Map<String, String> inputs) {}
}
