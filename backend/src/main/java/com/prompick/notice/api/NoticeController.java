package com.prompick.notice.api;

import com.prompick.notice.domain.Notice;
import com.prompick.notice.domain.NoticeRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * 공지사항.
 *
 * <p>로그인 없이 볼 수 있다. 점검 안내는 로그인이 안 되는 상황에서 가장 필요한 글이다. 그때
 * 읽으려면 로그인부터 하라고 하면 아무 소용이 없다.
 */
@RestController
@RequestMapping("/api/v1/notices")
@Tag(name = "공지사항")
public class NoticeController {

    private final NoticeRepository notices;

    public NoticeController(NoticeRepository notices) {
        this.notices = notices;
    }

    @GetMapping
    @Operation(summary = "공지 목록", description = "내보낸 것만. 고정된 것이 먼저다")
    @Transactional(readOnly = true)
    public List<NoticeResponse> list() {
        return notices.findPublished().stream().map(NoticeResponse::of).toList();
    }

    public record NoticeResponse(
            Long id, String title, String body, boolean pinned, Instant publishedAt) {

        static NoticeResponse of(Notice n) {
            return new NoticeResponse(
                    n.getId(), n.getTitle(), n.getBody(), n.isPinned(), n.getPublishedAt());
        }
    }
}
