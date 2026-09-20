package com.prompick.user.api;

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

    @PostMapping("/auth/signup")
    @Operation(summary = "가입", description = "계정을 만들고 회원 정보를 저장한다. 가입 후 바로 로그인할 수 있다")
    public SignUpResponse signUp(@Valid @RequestBody SignUpRequest request) {
        User user = users.signUp(request.email(), request.password(), request.nickname());
        return new SignUpResponse(user.getNickname());
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

    public record SignUpRequest(
            @Email(message = "이메일 형식이 올바르지 않아요") @NotBlank(message = "이메일을 입력해주세요")
                    String email,
            @NotBlank(message = "비밀번호를 입력해주세요")
                    @Size(min = 8, message = "비밀번호는 8자 이상으로 해주세요")
                    String password,
            @NotBlank(message = "닉네임을 입력해주세요")
                    @Size(min = 2, max = 20, message = "닉네임은 2~20자로 해주세요")
                    String nickname) {}

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
