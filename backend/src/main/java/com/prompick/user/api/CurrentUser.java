package com.prompick.user.api;

import java.lang.annotation.*;

/**
 * 로그인한 회원을 컨트롤러 인자로 받는다.
 *
 * <pre>public MeResponse me(@CurrentUser User user)</pre>
 *
 * 토큰이 없으면 {@code UNAUTHORIZED}로 끝난다. 컨트롤러마다 토큰을 뜯어보지 않게 하려는 장치다.
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface CurrentUser {}
