package com.prompick.admin.api;

import com.prompick.credit.app.CreditService;
import com.prompick.credit.domain.CreditAccount;
import com.prompick.credit.domain.CreditReason;
import com.prompick.credit.domain.CreditTransaction;
import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.user.domain.User;
import com.prompick.user.domain.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 사용자 관리.
 *
 * <p>돈이 오가는 서비스에서 운영자가 반드시 할 수 있어야 하는 일이 셋 있다 — 누가 쓰고 있는지
 * 보고, 문제가 생긴 계정을 멈추고, 잘못된 차감을 되돌리는 것. 이 셋이 없으면 사용자 문의에
 * 아무것도 해줄 수 없고, 부정 사용을 발견해도 손을 쓸 수 없다.
 *
 * <p>프롬비를 넣고 빼는 일은 전부 장부에 남는다. 누가 언제 왜 했는지 적지 않고 잔액을 고칠 수
 * 있으면, 그 순간부터 그 숫자는 아무 의미가 없다.
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@Tag(name = "관리자 - 사용자")
public class AdminUserController {

    private final UserRepository users;
    private final CreditService credits;

    public AdminUserController(UserRepository users, CreditService credits) {
        this.users = users;
        this.credits = credits;
    }

    @GetMapping
    @Operation(summary = "사용자 목록", description = "닉네임·이메일로 찾을 수 있다")
    public List<UserSummary> list(@RequestParam(required = false) String q) {
        String keyword = q == null ? "" : q.trim().toLowerCase();

        return users.findAll().stream()
                .filter(user -> keyword.isEmpty()
                        || (user.getNickname() != null
                                && user.getNickname().toLowerCase().contains(keyword))
                        || (user.getEmail() != null
                                && user.getEmail().toLowerCase().contains(keyword)))
                .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                .map(this::toSummary)
                .toList();
    }

    @GetMapping("/{id}")
    @Operation(summary = "사용자 한 명", description = "잔액과 최근 프롬비 내역을 함께 준다")
    public UserDetail detail(@PathVariable Long id) {
        User user = users.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        CreditAccount account = credits.accountOf(id);

        List<CreditEntry> history = credits.historyOf(id, 50).stream()
                .map(AdminUserController::toEntry)
                .toList();

        return new UserDetail(
                toSummary(user),
                account.getTotalCharged(),
                account.getTotalSpent(),
                history);
    }

    @PostMapping("/{id}/credits")
    @Operation(
            summary = "프롬비 지급·회수",
            description = "양수면 지급, 음수면 회수. 이유를 반드시 남긴다")
    public UserDetail adjustCredits(
            @PathVariable Long id,
            @Valid @RequestBody CreditAdjustRequest request,
            Authentication authentication) {

        users.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));
        String actor = authentication == null ? "unknown" : authentication.getName();

        if (request.amount() > 0) {
            credits.give(
                    id, request.amount(), CreditReason.ADMIN_GRANT, null, null, actor, request.memo());
        } else if (request.amount() < 0) {
            credits.revoke(id, -request.amount(), actor, request.memo());
        } else {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }
        return detail(id);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "계정 상태 바꾸기", description = "부정 사용이 확인된 계정을 멈춘다")
    public UserSummary changeStatus(@PathVariable Long id, @RequestBody StatusRequest request) {
        User user = users.findById(id).orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND));

        try {
            user.changeStatus(User.Status.valueOf(request.status()));
        } catch (IllegalArgumentException e) {
            throw new ApiException(ErrorCode.INVALID_REQUEST);
        }
        return toSummary(users.save(user));
    }

    private UserSummary toSummary(User user) {
        return new UserSummary(
                user.getId(),
                user.getNickname(),
                user.getEmail(),
                user.getRole().name(),
                user.getStatus().name(),
                user.isIdentityVerified(),
                credits.balanceOf(user.getId()),
                user.getCreatedAt(),
                user.getLastLoginAt());
    }

    private static CreditEntry toEntry(CreditTransaction t) {
        return new CreditEntry(
                t.getId(),
                t.getAmount(),
                t.getBalanceAfter(),
                t.getReason().name(),
                t.getReason().displayName(),
                t.getRefType(),
                t.getRefId(),
                t.getActor(),
                t.getMemo(),
                t.getCreatedAt());
    }

    /**
     * @param amount 양수면 지급, 음수면 회수. 0은 받지 않는다 — 아무 일도 하지 않는 거래를
     *     장부에 남기면 나중에 읽을 때 방해만 된다
     */
    public record CreditAdjustRequest(int amount, @Size(max = 300) String memo) {}

    public record StatusRequest(String status) {}

    public record UserSummary(
            Long id,
            String nickname,
            String email,
            String role,
            String status,
            boolean identityVerified,
            int creditBalance,
            Instant createdAt,
            Instant lastLoginAt) {}

    public record UserDetail(
            UserSummary user, int totalCharged, int totalSpent, List<CreditEntry> credits) {}

    public record CreditEntry(
            Long id,
            int amount,
            int balanceAfter,
            String reason,
            String reasonLabel,
            String refType,
            Long refId,
            String actor,
            String memo,
            Instant createdAt) {}
}
