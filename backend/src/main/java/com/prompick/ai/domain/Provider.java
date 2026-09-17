package com.prompick.ai.domain;

/** 외부 AI 제공사. 어댑터 구현체가 이 값으로 선택된다. */
public enum Provider {
    /** 개발·테스트용. 실제 호출 없이 샘플 결과를 돌려준다 */
    MOCK,
    /** 서버 내부 처리 (배경 제거, 리사이즈). 외부 호출 없음 */
    INTERNAL,
    OPENAI,
    GOOGLE,
    HIGGSFIELD,
    RUNWAY,
    KLING
}
