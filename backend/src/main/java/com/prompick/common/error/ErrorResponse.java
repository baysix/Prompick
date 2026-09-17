package com.prompick.common.error;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/**
 * 모든 에러 응답의 형식. (PRD 11장)
 *
 * <pre>{ "code": "...", "message": "..." }</pre>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(String code, String message, List<FieldError> errors) {

    public static ErrorResponse of(ErrorCode code, String message) {
        return new ErrorResponse(code.name(), message, null);
    }

    public static ErrorResponse of(ErrorCode code, String message, List<FieldError> errors) {
        return new ErrorResponse(code.name(), message, errors);
    }

    public record FieldError(String field, String message) {}
}
