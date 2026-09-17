package com.prompick.common.error;

/** 사용자에게 그대로 노출해도 안전한 에러. 내부 원인은 cause에만 담는다. */
public class ApiException extends RuntimeException {

    private final ErrorCode errorCode;

    public ApiException(ErrorCode errorCode) {
        super(errorCode.getDefaultMessage());
        this.errorCode = errorCode;
    }

    public ApiException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    /** 외부 API 예외 등 내부 원인을 함께 보관한다. cause는 응답에 나가지 않는다. */
    public ApiException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getDefaultMessage(), cause);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
