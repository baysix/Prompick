package com.prompick.admin.api.dto;

import com.prompick.template.domain.ContentType;
import com.prompick.template.domain.GenerateAccess;
import com.prompick.template.domain.PromptAccess;
import jakarta.validation.constraints.*;
import java.util.List;
import java.util.Map;

/** 템플릿 등록·수정 입력. 관리자 전용. */
public record TemplateForm(
        @NotBlank(message = "주소에 쓸 이름을 입력해주세요")
                @Pattern(
                        regexp = "^[a-z0-9]+(-[a-z0-9]+)*$",
                        message = "영문 소문자, 숫자, 하이픈만 쓸 수 있어요")
                String slug,
        @NotBlank(message = "제목을 입력해주세요") String title,
        String description,
        @NotNull(message = "종류를 골라주세요") ContentType contentType,
        /** 주제 묶음. 지금은 쓰지 않으므로 비워도 된다 */
        String categorySlug,

        // 이용 방식별 요금
        @NotNull(message = "프롬프트 제공 방식을 골라주세요") PromptAccess promptAccess,
        @PositiveOrZero int promptCost,
        @NotNull(message = "제작 방식을 골라주세요") GenerateAccess generateAccess,
        @PositiveOrZero int generateCost,

        // 결과물 규격
        @NotBlank String ratio,
        Integer durationSeconds,
        String resolution,
        @Positive(message = "예상 소요시간을 입력해주세요") int estimatedSeconds,

        // 가이드
        String requiredPhotoSummary,
        Map<String, Object> uploadGuide,
        List<String> tags,
        boolean pinned) {}
