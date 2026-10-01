package com.prompick.user.domain;

/** 무엇에 대한 동의인가. */
public enum ConsentKind {
    /** 이용약관 (필수) */
    TERMS,
    /** 개인정보 수집·이용 (필수) */
    PRIVACY,
    /** 만 14세 이상임 (필수) */
    AGE_14,
    /** 광고성 정보 수신 (선택) */
    MARKETING;

    /** 이것 없이는 가입할 수 없는 항목인가 */
    public boolean isRequired() {
        return this != MARKETING;
    }
}
