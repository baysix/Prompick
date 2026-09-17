package com.prompick.admin.api;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.user.app.UserService;
import com.prompick.user.domain.User;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 관리자 API 접근 제한.
 *
 * <p>관리자 API는 내부 프롬프트와 모델 구성을 다룬다. 이게 새면 서비스의 가치가 사라지므로,
 * 컨트롤러마다 검사를 넣어 빠뜨리는 일이 없도록 경로 단위로 한 번에 막는다.
 *
 * <p>권한은 토큰이 아니라 우리 DB의 회원 정보에서 읽는다. 토큰에 역할을 넣으면, 권한을 회수해도
 * 이미 발급된 토큰이 만료될 때까지 그대로 통과한다.
 */
@Component
public class AdminOnlyInterceptor implements HandlerInterceptor {

    private final UserService users;

    public AdminOnlyInterceptor(UserService users) {
        this.users = users;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request, HttpServletResponse response, Object handler) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            throw new ApiException(ErrorCode.UNAUTHORIZED);
        }

        UUID authUserId;
        try {
            authUserId = UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new ApiException(ErrorCode.UNAUTHORIZED);
        }

        User user = users.require(authUserId);
        if (user.getRole() != User.Role.ADMIN) {
            throw new ApiException(ErrorCode.FORBIDDEN);
        }
        return true;
    }
}
