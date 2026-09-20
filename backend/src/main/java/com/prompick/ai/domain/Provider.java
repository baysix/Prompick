package com.prompick.ai.domain;

/** 외부 AI 제공사. 어댑터 구현체가 이 값으로 선택된다. */
public enum Provider {
    /** 개발·테스트용. 실제 호출 없이 샘플 결과를 돌려준다 */
    MOCK,
    /** 서버 내부 처리 (배경 제거, 리사이즈). 외부 호출 없음 */
    INTERNAL,
    /** ChatGPT */
    OPENAI,
    /** Claude */
    ANTHROPIC,
    /** Gemini, Veo */
    GOOGLE,
    /** Grok */
    XAI,
    /** Seedance */
    BYTEDANCE,
    HIGGSFIELD,
    RUNWAY,
    KLING;

    /** 사람이 부르는 이름. 관리자 화면에 이대로 나간다 */
    public String displayName() {
        return switch (this) {
            case MOCK -> "목업 (개발용)";
            case INTERNAL -> "서버 내부 처리";
            case OPENAI -> "OpenAI (ChatGPT)";
            case ANTHROPIC -> "Anthropic (Claude)";
            case GOOGLE -> "Google (Gemini·Veo)";
            case XAI -> "xAI (Grok)";
            case BYTEDANCE -> "ByteDance (Seedance)";
            case HIGGSFIELD -> "Higgsfield";
            case RUNWAY -> "Runway";
            case KLING -> "Kling";
        };
    }

    /** 키가 필요한 제공사인지. 목업과 내부 처리는 외부로 나가지 않는다 */
    public boolean needsApiKey() {
        return this != MOCK && this != INTERNAL;
    }
}
