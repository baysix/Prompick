package com.prompick.user.api;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.config.PrompickProperties;
import com.prompick.user.app.UserService;
import com.prompick.user.domain.User;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import org.springframework.web.bind.annotation.*;

/**
 * 가입과 내 정보.
 *
 * <p>로그인(비밀번호 확인, 토큰 발급, 재발급)은 Supabase Auth가 처리한다. 프론트가 직접 호출하고,
 * 받은 토큰을 이 서버에 Bearer로 보낸다. 비밀번호는 우리 DB를 거치지 않는다.
 */
@RestController
@RequestMapping("/api/v1")
@Tag(name = "회원")
public class AuthController {

    private final com.prompick.credit.app.CreditService credits;

    private final UserService users;
    private final PrompickProperties properties;

    public AuthController(UserService users, PrompickProperties properties, com.prompick.credit.app.CreditService credits) {
        this.credits = credits;
        this.users = users;
        this.properties = properties;
    }

    @GetMapping("/legal")
    @Operation(
            summary = "약관 버전",
            description = "가입 화면이 이 값을 받아 그대로 돌려보낸다. 사용자가 본 문서와 기록이 어긋나지 않게 하기 위해서다")
    public LegalResponse legal() {
        return new LegalResponse(
                properties.legal().termsVersion(), properties.legal().privacyVersion());
    }

    @PostMapping("/auth/signup")
    @Operation(summary = "가입", description = "계정을 만들고 회원 정보와 동의 기록을 저장한다")
    public SignUpResponse signUp(@Valid @RequestBody SignUpRequest request) {
        requireAgreed(request.agreeTerms(), "이용약관");
        requireAgreed(request.agreePrivacy(), "개인정보 수집·이용");
        requireAgreed(request.agreeAge14(), "만 14세 이상 확인");
        requireCurrentVersion(request.termsVersion(), properties.legal().termsVersion());
        requireCurrentVersion(request.privacyVersion(), properties.legal().privacyVersion());

        User user = users.signUp(
                request.email(),
                request.password(),
                request.nickname(),
                Boolean.TRUE.equals(request.agreeMarketing()));
        return new SignUpResponse(user.getNickname());
    }

    private void requireAgreed(Boolean agreed, String what) {
        if (!Boolean.TRUE.equals(agreed)) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, what + "에 동의해야 가입할 수 있어요.");
        }
    }

    /**
     * 사용자가 본 문서가 지금 문서와 같은지 확인한다.
     *
     * <p>화면을 열어둔 채로 약관이 바뀐 경우를 막는다. 이 확인이 없으면 옛 문서를 보고 동의한
     * 사람이 새 문서에 동의한 것으로 기록되는데, 그러면 기록을 남기는 의미가 없어진다.
     */
    private void requireCurrentVersion(String seen, String current) {
        if (!current.equals(seen)) {
            throw new ApiException(
                    ErrorCode.INVALID_REQUEST, "약관이 바뀌었어요. 새로고침한 뒤 다시 확인해주세요.");
        }
    }

    @GetMapping("/me")
    @Operation(summary = "내 정보", description = "잔액과 오늘 남은 무료 횟수를 함께 준다")
    public MeResponse me(@CurrentUser User user) {
        return new MeResponse(
                user.getNickname(),
                user.getEmail(),
                user.getRole().name(),
                user.isIdentityVerified(),
                user.getPhoneVerifiedAt(),
                credits.balanceOf(user.getId()),
                properties.free().dailyGenerateLimit(),
                properties.credit().unitName());
    }

    @PatchMapping("/me")
    @Operation(summary = "닉네임 변경")
    public MeResponse changeNickname(
            @CurrentUser User user, @Valid @RequestBody NicknameRequest request) {
        return me(users.changeNickname(user.getAuthUserId(), request.nickname()));
    }

    /**
     * @param agreeMarketing 선택 항목. 거절도 기록하므로 보내지 않으면 거절로 본다
     * @param termsVersion 화면이 보여준 이용약관 버전. 지금 버전과 달라지면 가입을 막는다
     */
    public record SignUpRequest(
            @Email(message = "이메일 형식이 올바르지 않아요") @NotBlank(message = "이메일을 입력해주세요")
                    String email,
            @NotBlank(message = "비밀번호를 입력해주세요")
                    @Size(min = 8, message = "비밀번호는 8자 이상으로 해주세요")
                    String password,
            @NotBlank(message = "닉네임을 입력해주세요")
                    @Size(min = 2, max = 20, message = "닉네임은 2~20자로 해주세요")
                    String nickname,
            Boolean agreeTerms,
            Boolean agreePrivacy,
            Boolean agreeAge14,
            Boolean agreeMarketing,
            @NotBlank String termsVersion,
            @NotBlank String privacyVersion) {}

    public record LegalResponse(String termsVersion, String privacyVersion) {}

    public record SignUpResponse(String nickname) {}

    public record NicknameRequest(
            @NotBlank @Size(min = 2, max = 20, message = "닉네임은 2~20자로 해주세요") String nickname) {}

    public record MeResponse(
            String nickname,
            String email,
            String role,
            boolean identityVerified,
            Instant phoneVerifiedAt,
            int creditBalance,
            int freeDailyLimit,
            String creditUnitName) {}
}
