package com.prompick.common.error;

import jakarta.validation.ConstraintViolationException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * 모든 예외를 {@link ErrorResponse} 형식으로 변환한다.
 *
 * <p>예상하지 못한 예외의 원문은 서버 로그에만 남기고, 사용자에게는 내부 에러 코드만 보낸다.
 * 외부 AI 제공사·PG의 응답이 사용자에게 새지 않게 하기 위한 마지막 방어선이다.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException e) {
        ErrorCode code = e.getErrorCode();
        if (code.getStatus().is5xxServerError()) {
            log.error("API error: {}", code, e);
        } else {
            log.debug("API error: {} - {}", code, e.getMessage());
        }
        return ResponseEntity.status(code.getStatus()).body(ErrorResponse.of(code, e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        List<ErrorResponse.FieldError> fields = e.getBindingResult().getFieldErrors().stream()
                .map(f -> new ErrorResponse.FieldError(f.getField(), f.getDefaultMessage()))
                .toList();
        ErrorCode code = ErrorCode.INVALID_REQUEST;
        return ResponseEntity.status(code.getStatus())
                .body(ErrorResponse.of(code, code.getDefaultMessage(), fields));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException e) {
        ErrorCode code = ErrorCode.INVALID_REQUEST;
        return ResponseEntity.status(code.getStatus())
                .body(ErrorResponse.of(code, code.getDefaultMessage()));
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResource(NoResourceFoundException e) {
        ErrorCode code = ErrorCode.NOT_FOUND;
        return ResponseEntity.status(code.getStatus())
                .body(ErrorResponse.of(code, code.getDefaultMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception e) {
        // 원문은 로그에만. 사용자에게는 일반 문구만 나간다.
        log.error("Unhandled exception", e);
        ErrorCode code = ErrorCode.INTERNAL_ERROR;
        return ResponseEntity.status(code.getStatus())
                .body(ErrorResponse.of(code, code.getDefaultMessage()));
    }
}
