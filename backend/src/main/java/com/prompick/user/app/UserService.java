package com.prompick.user.app;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.config.PrompickProperties;
import com.prompick.user.domain.ConsentKind;
import com.prompick.user.domain.User;
import com.prompick.user.domain.UserConsent;
import com.prompick.user.domain.UserConsentRepository;
import com.prompick.user.domain.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UserService {

    private final UserRepository users;
    private final SupabaseAuthClient auth;
    private final UserConsentRepository consents;
    private final PrompickProperties properties;

    public UserService(
            UserRepository users,
            SupabaseAuthClient auth,
            UserConsentRepository consents,
            PrompickProperties properties) {
        this.users = users;
        this.auth = auth;
        this.consents = consents;
        this.properties = properties;
    }

    /**
     * 가입.
     *
     * <p>계정 생성과 회원 행 저장은 함께 성공해야 한다. 회원 행 저장이 실패하면 만들어 둔 계정을 지운다.
     * 그러지 않으면 로그인은 되는데 서비스에는 없는 사용자가 남는다.
     */
    public User signUp(
            String email, String password, String nickname, boolean marketingAgreed) {
        String trimmed = nickname.trim();
        if (users.existsByNickname(trimmed)) {
            throw new ApiException(ErrorCode.INVALID_REQUEST, "이미 쓰고 있는 닉네임이에요.");
        }

        UUID authUserId = auth.createUser(email, password);
        try {
            User user = users.save(new User(authUserId, email, trimmed));
            recordSignUpConsents(user.getId(), marketingAgreed);
            return user;
        } catch (RuntimeException e) {
            auth.deleteUser(authUserId);
            throw e;
        }
    }

    /**
     * 가입할 때의 동의를 남긴다.
     *
     * <p>필수 항목은 컨트롤러에서 이미 막았으므로 여기서는 전부 동의한 것으로 적는다. 선택
     * 항목인 광고 수신은 거절도 기록한다 — "거절했다"는 사실이 남아야 나중에 보낸 적이 있는지
     * 다툴 때 근거가 된다. 안 보낸 것과 보내면 안 되는 줄 몰랐던 것은 다르다.
     *
     * <p>버전은 요청에 담겨 온 값이 아니라 서버가 지금 들고 있는 값을 쓴다. 컨트롤러가 둘이
     * 같은지 먼저 확인하므로, 사용자가 본 문서와 여기 적히는 버전은 일치한다.
     */
    private void recordSignUpConsents(Long userId, boolean marketingAgreed) {
        String terms = properties.legal().termsVersion();
        String privacy = properties.legal().privacyVersion();

        // 만 14세 확인과 광고 수신은 개인정보처리방침 쪽에 적힌 내용이라 그 버전을 따른다.
        List<UserConsent> rows = new ArrayList<>(4);
        rows.add(new UserConsent(userId, ConsentKind.TERMS, terms, true));
        rows.add(new UserConsent(userId, ConsentKind.PRIVACY, privacy, true));
        rows.add(new UserConsent(userId, ConsentKind.AGE_14, privacy, true));
        rows.add(new UserConsent(userId, ConsentKind.MARKETING, privacy, marketingAgreed));

        consents.saveAll(rows);
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
