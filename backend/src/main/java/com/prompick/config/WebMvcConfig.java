package com.prompick.config;

import com.prompick.admin.api.AdminOnlyInterceptor;
import com.prompick.user.api.CurrentUserArgumentResolver;
import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final CurrentUserArgumentResolver currentUser;
    private final AdminOnlyInterceptor adminOnly;

    public WebMvcConfig(CurrentUserArgumentResolver currentUser, AdminOnlyInterceptor adminOnly) {
        this.currentUser = currentUser;
        this.adminOnly = adminOnly;
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(currentUser);
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 관리자 경로 전체를 한 번에 막는다. 컨트롤러가 늘어나도 검사를 빠뜨릴 수 없다.
        registry.addInterceptor(adminOnly).addPathPatterns("/api/v1/admin/**");
    }
}
