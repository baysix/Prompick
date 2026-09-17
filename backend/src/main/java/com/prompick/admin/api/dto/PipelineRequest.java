package com.prompick.admin.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

/**
 * 파이프라인 등록·수정 요청. 관리자 전용.
 *
 * <p>단계마다 어떤 AI 모델을 쓸지 여기서 고른다. 한 템플릿 안에서 단계별로 제공사가 달라도 된다.
 */
public record PipelineRequest(
        @NotEmpty(message = "단계를 하나 이상 넣어주세요") @Valid List<Step> steps,
        String adminMemo,
        /** 저장과 동시에 활성 버전으로 만들지 */
        boolean activate) {

    public record Step(
            @NotBlank(message = "단계 유형을 골라주세요") String type,

            /**
             * 사용할 AI 모델. {@code ai_models.id}.
             *
             * <p>서버 내부 처리 단계(배경 제거 등)도 모델로 등록되어 있으므로 항상 필요하다.
             */
            @NotNull(message = "이 단계에서 사용할 AI를 골라주세요") Long modelId,

            /** 이 단계에 넣을 내부 프롬프트. {{변수}}는 입력 필드 값으로 치환된다 */
            String prompt,

            /** 모델별 파라미터. 어떤 값을 받는지는 ai_models.param_schema 를 따른다 */
            Map<String, Object> params,

            /** 앞 단계 결과나 사용자 입력을 이 단계의 입력으로 연결한다 */
            Map<String, String> inputs) {}
}
