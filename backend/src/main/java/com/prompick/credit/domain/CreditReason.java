package com.prompick.credit.domain;

/** 프롬비가 오간 이유. 장부를 읽을 때 이 값만 보고도 무슨 일이었는지 알 수 있어야 한다 */
public enum CreditReason {
    /** 사용자가 결제해서 충전 */
    PURCHASE,
    /** 관리자가 지급. 보상·이벤트·테스트 */
    ADMIN_GRANT,
    /** 관리자가 회수. 잘못 지급했거나 부정 사용 */
    ADMIN_REVOKE,
    SIGNUP_BONUS,
    /** 제작에 사용 */
    GENERATE,
    /** 프롬프트 열람에 사용 */
    PROMPT_UNLOCK,
    /** 실패해서 돌려줌 */
    REFUND;

    public String displayName() {
        return switch (this) {
            case PURCHASE -> "충전";
            case ADMIN_GRANT -> "관리자 지급";
            case ADMIN_REVOKE -> "관리자 회수";
            case SIGNUP_BONUS -> "가입 축하";
            case GENERATE -> "제작";
            case PROMPT_UNLOCK -> "프롬프트 열람";
            case REFUND -> "환불";
        };
    }
}
