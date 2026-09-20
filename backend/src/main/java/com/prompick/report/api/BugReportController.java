package com.prompick.report.api;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.report.domain.BugReport;
import com.prompick.report.domain.BugReportRepository;
import com.prompick.report.domain.BugReportStatus;
import com.prompick.user.api.CurrentUser;
import com.prompick.user.domain.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Limit;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * 오류 신고.
 *
 * <p>올리는 것과 자기 것을 읽는 것만 있다. 남의 신고는 볼 수 없다 — 고치기 전의 신고에는
 * "이렇게 하면 남의 작업이 보인다" 같은 내용이 적히고, 그것을 공개하면 고칠 때까지 그 글이
 * 곧 공격 안내문이 된다. 전체 목록은 운영 화면에만 있다.
 *
 * <p>로그인을 요구하는 이유는 되물을 수 있어야 하기 때문이다. 재현이 안 되는 신고는 대개
 * 한 번 더 물어봐야 고칠 수 있는데, 익명이면 그 길이 없다.
 */
@RestController
@RequestMapping("/api/v1/bug-reports")
@Tag(name = "오류 신고")
public class BugReportController {

    /** 한 사람이 한 시간에 올릴 수 있는 신고 수. 실수로 여러 번 누르는 것과 도배를 함께 막는다 */
    private static final int HOURLY_LIMIT = 10;

    private final BugReportRepository reports;

    public BugReportController(BugReportRepository reports) {
        this.reports = reports;
    }

    @PostMapping
    @Operation(summary = "신고 올리기", description = "화면 주소와 브라우저 정보는 화면이 자동으로 채운다")
    @Transactional
    public MyReportResponse create(
            @CurrentUser User user,
            @Valid @RequestBody ReportForm form,
            @RequestHeader(value = "User-Agent", required = false) String userAgent) {

        long recent =
                reports.countByUserIdAndCreatedAtAfter(
                        user.getId(), Instant.now().minus(Duration.ofHours(1)));
        if (recent >= HOURLY_LIMIT) {
            throw new ApiException(ErrorCode.TOO_MANY_REQUESTS);
        }

        BugReport report =
                new BugReport(
                        user.getId(),
                        form.title().trim(),
                        form.body().trim(),
                        trim(form.pageUrl(), 500),
                        trim(userAgent, 500));

        return MyReportResponse.of(reports.save(report));
    }

    @GetMapping("/mine")
    @Operation(summary = "내가 올린 신고", description = "운영자가 남긴 답을 여기서 확인한다")
    @Transactional(readOnly = true)
    public List<MyReportResponse> mine(@CurrentUser User user) {
        return reports.findByUserIdOrderByIdDesc(user.getId(), Limit.of(50)).stream()
                .map(MyReportResponse::of)
                .toList();
    }

    /** 길이를 넘기면 자른다. 긴 User-Agent 하나 때문에 신고가 통째로 실패하면 안 된다 */
    private static String trim(String value, int max) {
        if (value == null || value.isBlank()) return null;
        return value.length() <= max ? value : value.substring(0, max);
    }

    public record ReportForm(
            @NotBlank @Size(max = 160) String title,
            @NotBlank @Size(max = 5000) String body,
            @Size(max = 500) String pageUrl) {}

    public record MyReportResponse(
            Long id,
            String title,
            String body,
            String pageUrl,
            BugReportStatus status,
            String statusLabel,
            String adminNote,
            Instant createdAt) {

        static MyReportResponse of(BugReport r) {
            return new MyReportResponse(
                    r.getId(),
                    r.getTitle(),
                    r.getBody(),
                    r.getPageUrl(),
                    r.getStatus(),
                    r.getStatus().displayName(),
                    r.getAdminNote(),
                    r.getCreatedAt());
        }
    }
}
