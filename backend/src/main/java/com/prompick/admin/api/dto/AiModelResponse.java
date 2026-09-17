package com.prompick.admin.api.dto;

import com.prompick.ai.domain.AiModel;
import com.prompick.ai.domain.Capability;
import com.prompick.ai.domain.Provider;
import java.util.Map;

/**
 * 관리자용 AI 모델 응답.
 *
 * <p>관리자 전용이다. 사용자용 DTO와 클래스 단위로 분리되어 있어 섞일 수 없다.
 */
public record AiModelResponse(
        Long id,
        Provider provider,
        String modelKey,
        String displayName,
        Capability capability,
        int unitCostKrw,
        Map<String, Object> paramSchema,
        boolean active,
        String memo) {

    public static AiModelResponse from(AiModel m) {
        return new AiModelResponse(
                m.getId(),
                m.getProvider(),
                m.getModelKey(),
                m.getDisplayName(),
                m.getCapability(),
                m.getUnitCostKrw(),
                m.getParamSchema(),
                m.isActive(),
                m.getMemo());
    }
}
