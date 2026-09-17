package com.prompick.template.api.dto;

import java.util.List;

/** 커서 기반 페이지. 무한 스크롤에 쓴다. */
public record CursorPage<T>(List<T> items, String nextCursor, boolean hasNext) {

    public static <T> CursorPage<T> of(List<T> items, String nextCursor) {
        return new CursorPage<>(items, nextCursor, nextCursor != null);
    }
}
