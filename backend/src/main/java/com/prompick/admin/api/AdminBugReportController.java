package com.prompick.admin.api;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.report.domain.BugReport;
import com.prompick.report.domain.BugReportRepository;
import com.prompick.report.domain.BugReportStatus;
import com.prompick.user.domain.User;
import com.prompick.user.domain.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.data.domain.Limit;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

/**
 * 오류 신고 관리. 관리자 전용.
 *
 * <p>신고자는 닉네임만 나간다. 이메일이 필요해지는 경우는 되묻기 위해서인데, 그때는 사용자
 * 화면에서 찾으면 된다. 목록에 얹어두면 화면을 열어둔 것만으로 새어 나갈 수 있다.
 */
@RestController
@RequestMapping("/api/v1/admin/bug-reports")
@Tag(name = "관리자 - 오류 신고")
public class AdminBugReportController {

    private final BugReportRepository reports;
    private final UserRepository users;

    public AdminBugReportController(BugReportRepository reports, UserRepository users) {
        this.reports = reports;
        this.users = users;
    }

    @GetMapping
    @Operation(summary = "신고 목록", description = "status 를 주면 그 상태만. 기본은 전부, 최신순")
    @Transactional(readOnly = true)
    public List<AdminReportResponse> list(
            @RequestParam(required = false) BugReportStatus status,
            @RequestParam(defaultValue = "100") int size) {

        Limit limit = Limit.of(Math.clamp(size, 1, 200));
        List<BugReport> items =
                status == null
                        ? reports.findAllByOrderByIdDesc(limit)
                        : reports.findByStatusOrderByIdDesc(status, limit);

        Map<Long, String> nicknames = nicknamesOf(items);
        return items.stream().map(r -> AdminReportResponse.of(r, nicknames)).toList();
    }

    @GetMapping("/counts")
    @Operation(summary = "상태별 건수", description = "대시보드에서 '봐야 할 것이 있는지'를 한 줄로 알려준다")
    @Transactional(readOnly = true)
    public Map<String, Long> counts() {
        Map<String, Long> result = new LinkedHashMap<>();
        for (BugReportStatus status : Arrays.asList(BugReportStatus.values())) {
            result.put(status.name(), reports.countByStatus(status));
        }
        return result;
    }

    @PostMapping("/{id}/resolve")
    @Operation(
            summary = "상태 바꾸기",
            description = "오류가 아니거나 중복으로 닫을 때는 이유를 반드시 남긴다")
    @Transactional
    public AdminReportResponse resolve(@PathVariable Long id, @Valid @RequestBody ResolveForm form) {
        BugReport report =
                reports.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        boolean closingWithoutFix =
                form.status() == BugReportStatus.NOT_A_BUG
                        || form.status() == BugReportStatus.DUPLICATE;

        // 이유 없이 닫힌 신고는 올린 사람에게 무시당한 것과 같다. 그다음부터는 아무도 신고하지 않는다.
        if (closingWithoutFix && (form.adminNote() == null || form.adminNote().isBlank())) {
            throw new ApiException(
                    ErrorCode.INVALID_REQUEST, "이렇게 닫을 때는 이유를 적어주세요. 신고한 사람이 읽어요.");
        }

        report.resolve(
                form.status(), form.adminNote() == null ? null : form.adminNote().trim());

        return AdminReportResponse.of(report, nicknamesOf(List.of(report)));
    }

    private Map<Long, String> nicknamesOf(List<BugReport> items) {
        Set<Long> ids = items.stream().map(BugReport::getUserId).collect(Collectors.toSet());
        if (ids.isEmpty()) return Map.of();
        return users.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, User::getNickname, (a, b) -> a));
    }

    public record ResolveForm(@NotNull BugReportStatus status, String adminNote) {}

    public record AdminReportResponse(
            Long id,
            String nickname,
            String title,
            String body,
            String pageUrl,
            String userAgent,
            BugReportStatus status,
            String statusLabel,
            String adminNote,
            Instant createdAt,
            Instant updatedAt) {

        static AdminReportResponse of(BugReport r, Map<Long, String> nicknames) {
            return new AdminReportResponse(
                    r.getId(),
                    nicknames.getOrDefault(r.getUserId(), "(탈퇴한 회원)"),
                    r.getTitle(),
                    r.getBody(),
                    r.getPageUrl(),
                    r.getUserAgent(),
                    r.getStatus(),
                    r.getStatus().displayName(),
                    r.getAdminNote(),
                    r.getCreatedAt(),
                    r.getUpdatedAt());
        }
    }
}
