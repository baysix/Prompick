package com.prompick.template.domain;

/** 프롬프트 원문을 어떻게 제공하는지 */
public enum PromptAccess {
    /** 로그인하면 원문을 볼 수 있다 */
    FREE,
    /** 프롬비를 내면 원문을 볼 수 있다 */
    PAID,
    /** 원문을 제공하지 않는다. 이 템플릿은 여기서 만들어야만 한다 */
    HIDDEN;

    public boolean isDisclosed() {
        return this != HIDDEN;
    }
}
