package com.prompick.user.app;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.user.domain.User;
import com.prompick.user.domain.UserRepository;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {

    private final UserRepository users;
    private final SupabaseAuthClient auth;

    public UserService(UserRepository users, SupabaseAuthClient auth) {
        this.users = users;
        this.auth = auth;
    }

    /**
     * 가입.
     *
     * <p>계정 생성과 회원 행 저장은 함께 성공해야 한다. 회원 행 저장이 실패하면 만들어 둔 계정을 지운다.
     * 그러지 않으면 로그인은 되는데 서비스에는 없는 사용자가 남는다.
     */
    public User signUp(String email, String password, String nickname) {
        String trimmed = nickname.trim();
        if (users.existsByNickname(trimmed)) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "이미 쓰고 있는 닉네임이에요.");
        }

        UUID authUserId = auth.createUser(email, password);
        try {
            return users.save(new User(authUserId, email, trimmed));
        } catch (RuntimeException e) {
            auth.deleteUser(authUserId);
            throw e;
        }
    }

    /**
     * 토큰의 주인을 찾는다.
     *
     * <p>소셜 로그인으로 처음 들어온 사용자는 우리 회원 행이 없다. 그때는 이 자리에서 만들어 준다.
     * 로그인 직후 별도 절차 없이 바로 서비스를 쓸 수 있게 하기 위해서다.
     */
    public User resolve(UUID authUserId, String email) {
        User user = users.findByAuthUserId(authUserId)
                .orElseGet(() -> users.save(new User(authUserId, email, defaultNickname(email))));

        if (!user.isActive()) {
            throw new ApiException(ErrorCode.ACCOUNT_SUSPENDED);
        }
        user.touchLogin();
        return user;
    }

    @Transactional(readOnly = true)
    public User require(UUID authUserId) {
        return users.findByAuthUserId(authUserId)
                .orElseThrow(() -> new ApiException(ErrorCode.UNAUTHORIZED));
    }

    /** @return 바뀐 뒤의 회원. 호출한 쪽이 옛 객체를 다시 쓰지 않도록 갱신본을 돌려준다. */
    public User changeNickname(UUID authUserId, String nickname) {
        String trimmed = nickname.trim();
        User user = require(authUserId);
        if (!trimmed.equals(user.getNickname()) && users.existsByNickname(trimmed)) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "이미 쓰고 있는 닉네임이에요.");
        }
        user.changeNickname(trimmed);
        return user;
    }

    /** 이메일 앞부분을 닉네임으로 쓰되, 겹치면 뒤에 숫자를 붙인다. */
    private String defaultNickname(String email) {
        String base = email == null || email.isBlank()
                ? "프롬픽"
                : email.substring(0, Math.min(email.indexOf('@') > 0 ? email.indexOf('@') : email.length(), 20));

        String candidate = base;
        int suffix = 1;
        while (users.existsByNickname(candidate)) {
            candidate = base + suffix++;
        }
        return candidate;
    }
}
