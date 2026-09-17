package com.prompick.config;

import javax.crypto.spec.SecretKeySpec;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

/**
 * Supabase Auth가 발급한 액세스 토큰을 검증한다.
 *
 * <p>로그인(카카오·구글) 자체는 Supabase가 처리하고, 백엔드는 토큰의 서명과 issuer만 확인한다.
 * SUPABASE_URL이 비어 있으면 이 설정이 동작하지 않으므로, 인증 없이도 서버는 뜬다.
 *
 * <p>서명 방식은 프로젝트마다 다르다.
 *
 * <ul>
 *   <li>최근 프로젝트: 비대칭키. JWKS 주소에서 공개키를 받아 검증한다.
 *   <li>예전 프로젝트: HS256 대칭키. SUPABASE_JWT_SECRET을 채우면 그 방식으로 검증한다.
 * </ul>
 */
@Configuration
public class SupabaseAuthConfig {

    private static final Logger log = LoggerFactory.getLogger(SupabaseAuthConfig.class);

    @Bean
    public JwtDecoder jwtDecoder(PrompickProperties properties) {
        PrompickProperties.Supabase supabase = properties.supabase();

        if (!supabase.isConfigured()) {
            log.warn("SUPABASE_URL 이 비어 있어 인증이 꺼진 상태로 실행합니다. 로그인이 필요한 API는 동작하지 않습니다.");
            return token -> {
                throw new org.springframework.security.oauth2.jwt.BadJwtException("인증이 설정되지 않았습니다.");
            };
        }

        NimbusJwtDecoder decoder;
        if (supabase.usesLegacyJwtSecret()) {
            decoder = NimbusJwtDecoder.withSecretKey(
                            new SecretKeySpec(
                                    supabase.jwtSecret().getBytes(java.nio.charset.StandardCharsets.UTF_8),
                                    "HmacSHA256"))
                    .build();
            log.info("Supabase Auth: 대칭키(HS256)로 토큰을 검증합니다.");
        } else {
            // Supabase는 ES256(타원곡선)으로 서명한다. NimbusJwtDecoder의 기본값은 RS256뿐이라
            // 지정하지 않으면 서명이 맞아도 "지원하지 않는 알고리즘"으로 거부된다.
            decoder = NimbusJwtDecoder.withJwkSetUri(supabase.jwksUri())
                    .jwsAlgorithms(algorithms -> {
                        algorithms.add(SignatureAlgorithm.ES256);
                        algorithms.add(SignatureAlgorithm.RS256);
                    })
                    .build();
            log.info("Supabase Auth: JWKS로 토큰을 검증합니다. {}", supabase.jwksUri());
        }

        // 다른 Supabase 프로젝트가 발급한 토큰이 통과하지 않도록 issuer를 반드시 확인한다.
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(supabase.issuer()));
        return decoder;
    }
}
