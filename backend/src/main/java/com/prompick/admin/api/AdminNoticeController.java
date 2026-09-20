package com.prompick.admin.api;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.notice.domain.Notice;
import com.prompick.notice.domain.NoticeRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/** 공지 관리. 관리자 전용. */
@RestController
@RequestMapping("/api/v1/admin/notices")
@Tag(name = "관리자 - 공지사항")
@Transactional
public class AdminNoticeController {

    private final NoticeRepository notices;

    public AdminNoticeController(NoticeRepository notices) {
        this.notices = notices;
    }

    @GetMapping
    @Operation(summary = "공지 목록", description = "작성 중인 것까지 전부")
    @Transactional(readOnly = true)
    public List<AdminNoticeResponse> list() {
        return notices.findAllByOrderByIdDesc().stream().map(AdminNoticeResponse::of).toList();
    }

    @PostMapping
    @Operation(summary = "공지 작성", description = "만들면 작성 중 상태다. 내보내기를 따로 눌러야 사용자에게 보인다")
    public AdminNoticeResponse create(@Valid @RequestBody NoticeForm form) {
        Notice notice = new Notice(form.title().trim(), form.body().trim(), form.pinned());
        return AdminNoticeResponse.of(notices.save(notice));
    }

    @PutMapping("/{id}")
    @Operation(summary = "공지 수정")
    public AdminNoticeResponse update(@PathVariable Long id, @Valid @RequestBody NoticeForm form) {
        Notice notice = find(id);
        notice.update(form.title().trim(), form.body().trim(), form.pinned());
        return AdminNoticeResponse.of(notice);
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "내보내기", description = "이미 나간 공지의 시각은 바뀌지 않는다")
    public AdminNoticeResponse publish(@PathVariable Long id) {
        Notice notice = find(id);
        notice.publish();
        return AdminNoticeResponse.of(notice);
    }

    @PostMapping("/{id}/unpublish")
    @Operation(summary = "내리기")
    public AdminNoticeResponse unpublish(@PathVariable Long id) {
        Notice notice = find(id);
        notice.unpublish();
        return AdminNoticeResponse.of(notice);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "삭제", description = "되돌릴 수 없다. 잘못 알린 공지는 지우기보다 내리는 편이 낫다")
    public void delete(@PathVariable Long id) {
        notices.delete(find(id));
    }

    private Notice find(Long id) {
        return notices.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
    }

    public record NoticeForm(
            @NotBlank @Size(max = 160) String title,
            @NotBlank String body,
            boolean pinned) {}

    public record AdminNoticeResponse(
            Long id,
            String title,
            String body,
            boolean pinned,
            boolean published,
            Instant publishedAt,
            Instant updatedAt) {

        static AdminNoticeResponse of(Notice n) {
            return new AdminNoticeResponse(
                    n.getId(),
                    n.getTitle(),
                    n.getBody(),
                    n.isPinned(),
                    n.isPublished(),
                    n.getPublishedAt(),
                    n.getUpdatedAt());
        }
    }
}
