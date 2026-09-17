package com.prompick.admin.api.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * 공개용 프롬프트 등록 입력.
 *
 * <p>여기 넣는 값은 사용자가 그대로 복사해 다른 AI 서비스에 붙여넣는 텍스트다.
 * 서버가 실제로 실행하는 내부 프롬프트는 파이프라인에 따로 넣는다. 둘은 같을 필요가 없고,
 * 보통 다르다.
 */
public record PublicPromptForm(
        @NotBlank(message = "프롬프트 원문을 입력해주세요") String body,
        String negativePrompt,
        /** 어디에 붙여넣으면 되는지 (예: Midjourney v7) */
        String recommendedTool,
        String usageTip) {}
