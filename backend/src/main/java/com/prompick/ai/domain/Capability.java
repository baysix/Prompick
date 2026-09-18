package com.prompick.ai.domain;

/**
 * 모델이 담당하는 단계 유형.
 *
 * <p>관리자가 파이프라인 단계를 만들 때, 그 단계에 맞는 모델만 후보로 보여주기 위해 쓴다.
 */
public enum Capability {
    /** 프롬프트 가공, 제품 설명 생성 */
    TEXT,
    /** 이미지 이해. 업로드 사진에서 제품 종류·색상 추출 */
    VISION,
    /** 이미지 생성 */
    IMAGE,
    /** 이미지 편집. 배경 제거, 비율 맞추기 */
    IMAGE_EDIT,
    /** 영상 생성 */
    VIDEO
}
