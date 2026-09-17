package com.prompick.common.error;

import org.springframework.http.HttpStatus;

/**
 * 사용자에게 나가는 에러 코드.
 *
 * <p>외부 AI API나 PG의 응답 원문을 그대로 전달하지 않고 반드시 이 코드로 변환한다.
 * (PRD 2-3 프롬프트 보호 규칙 6번)
 */
public enum ErrorCode {

    // 공통
    INVALID_REQUEST(HttpStatus.BAD_REQUEST, "요청 값이 올바르지 않아요."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요해요."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "권한이 없어요."),
    NOT_FOUND(HttpStatus.NOT_FOUND, "요청하신 정보를 찾을 수 없어요."),
    TOO_MANY_REQUESTS(HttpStatus.TOO_MANY_REQUESTS, "요청이 너무 잦아요. 잠시 후 다시 시도해주세요."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요."),

    // 회원·인증
    IDENTITY_VERIFICATION_REQUIRED(HttpStatus.FORBIDDEN, "휴대폰 본인인증이 필요해요."),
    ACCOUNT_SUSPENDED(HttpStatus.FORBIDDEN, "이용이 정지된 계정이에요."),

    // 템플릿
    TEMPLATE_NOT_AVAILABLE(HttpStatus.NOT_FOUND, "지금은 이용할 수 없는 템플릿이에요."),
    PROMPT_NOT_PUBLIC(HttpStatus.FORBIDDEN, "이 템플릿은 프롬프트를 제공하지 않아요."),
    PROMPT_NOT_PURCHASED(HttpStatus.PAYMENT_REQUIRED, "프롬프트를 먼저 열람해야 해요."),

    // 업로드
    UPLOAD_BLOCKED(HttpStatus.BAD_REQUEST, "이 사진으로는 진행할 수 없어요."),
    UPLOAD_TOO_LARGE(HttpStatus.PAYLOAD_TOO_LARGE, "사진 용량이 너무 커요."),
    UPLOAD_UNSUPPORTED_TYPE(HttpStatus.BAD_REQUEST, "지원하지 않는 형식이에요."),

    // 크레딧(프롬비)·무료 횟수
    INSUFFICIENT_CREDIT(HttpStatus.PAYMENT_REQUIRED, "프롬비가 부족해요."),
    FREE_LIMIT_EXCEEDED(HttpStatus.FORBIDDEN, "오늘 무료 제작 횟수를 모두 사용했어요."),

    // 생성
    GENERATION_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "제작에 실패했어요. 사용한 프롬비는 돌려드렸어요."),
    GENERATION_TIMEOUT(HttpStatus.INTERNAL_SERVER_ERROR, "제작 시간이 너무 오래 걸려 중단했어요."),

    // 결제
    PAYMENT_AMOUNT_MISMATCH(HttpStatus.BAD_REQUEST, "결제 금액이 일치하지 않아요."),
    PAYMENT_ALREADY_PROCESSED(HttpStatus.CONFLICT, "이미 처리된 결제예요."),
    PAYMENT_VERIFICATION_FAILED(HttpStatus.BAD_REQUEST, "결제 확인에 실패했어요.");

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}
