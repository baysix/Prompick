package com.prompick.template.api.dto;

import com.prompick.template.domain.ContentType;
import com.prompick.template.domain.GenerateAccess;
import com.prompick.template.domain.PromptAccess;

/**
 * 목록 카드. 사용자용.
 *
 * <p>이 클래스에는 파이프라인 관련 필드가 없다. 관리자용 DTO와 클래스 단위로 분리되어 있으므로,
 * 여기에 내부 정보가 섞이려면 누군가 일부러 필드를 추가해야만 한다.
 */
public record TemplateCardResponse(
        String slug,
        String title,
        ContentType contentType,
        String categoryName,
        /** 목록에서 자동재생할 저용량 미리보기 URL */
        String previewUrl,
        String thumbnailUrl,
        /** 예: "제품 사진 1장" */
        String requiredPhotoSummary,
        String ratio,
        /**
         * 예시 그림의 실제 비율 (예: "281 / 352").
         *
         * <p>목록에서 타일이 차지할 자리를 이 값으로 잡는다. 올린 그림이 잘리지 않게 하려는
         * 것이다. 크기를 모르는 예시는 null이고, 화면은 {@code ratio}로 대신한다.
         */
        String mediaRatio,
        PromptAccess promptAccess,
        int promptCost,
        GenerateAccess generateAccess,
        int generateCost,
        long generationCount) {}
