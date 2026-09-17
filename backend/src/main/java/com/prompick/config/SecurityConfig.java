package com.prompick.config;

import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * 0단계 보안 설정.
 *
 * <p>비로그인 방문자도 홈·탐색·검색·상세를 볼 수 있어야 하므로 조회 API는 열어둔다.
 * 실제 이용(프롬프트 열람, 자동 제작)에 필요한 인증은 3단계에서 JWT와 함께 붙인다.
 */
@Configuration
public class SecurityConfig {

    private final PrompickProperties properties;

    public SecurityConfig(PrompickProperties properties) {
        this.properties = properties;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http.csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .authorizeHttpRequests(auth -> auth.requestMatchers(
                                "/actuator/health/**",
                                "/api/v1/health",
                                "/docs/**",
                                "/swagger-ui/**",
                                "/api-docs/**",
                                "/files/**")
                        .permitAll()
                        // 공개 조회 API (PRD 11-1)
                        .requestMatchers(
                                HttpMethod.GET,
                                "/api/v1/home",
                                "/api/v1/categories",
                                "/api/v1/templates/**")
                        .permitAll()
                        // 웹훅은 서명으로 검증한다. (포트원, AI 제공사)
                        .requestMatchers("/api/v1/webhooks/**")
                        .permitAll()
                        // 가입은 로그인 전에 하는 일이다.
                        .requestMatchers(HttpMethod.POST, "/api/v1/auth/signup")
                        .permitAll()
                        // 관리자 API는 파이프라인 원문을 다룬다. 관리자 로그인을 붙이면 ADMIN 검사로 바꾼다.
                        .requestMatchers("/api/v1/admin/**")
                        .permitAll()
                        // 그 밖의 API는 로그인이 필요하다. 실제 이용(제작, 프롬프트 열람, 마이페이지)이
                        // 여기에 해당한다.
                        .anyRequest()
                        .authenticated())
                // Supabase가 발급한 액세스 토큰을 Bearer로 받아 검증한다.
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> {}))
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(properties.cors().allowedOrigins());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }
}
