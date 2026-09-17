package com.prompick.user.app;

import com.prompick.common.error.ApiException;
import com.prompick.common.error.ErrorCode;
import com.prompick.config.PrompickProperties;
import java.util.Map;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

/**
 * Supabase Auth 관리 API.
 *
 * <p>가입을 백엔드에서 처리하는 이유: 닉네임 검증과 약관 동의 같은 우리 정책을 먼저 확인한 뒤에
 * 계정을 만들어야 하고, 계정만 생기고 우리 회원 행이 없는 어중간한 상태를 막아야 하기 때문이다.
 *
 * <p>service_role 키를 쓰므로 이 클래스는 서버에서만 동작한다.
 */
@Component
public class SupabaseAuthClient {

    private static final Logger log = LoggerFactory.getLogger(SupabaseAuthClient.class);

    private final RestClient client;
    private final boolean configured;

    public SupabaseAuthClient(PrompickProperties properties) {
        PrompickProperties.Supabase supabase = properties.supabase();
        this.configured = supabase.isConfigured();
        this.client = configured
                ? RestClient.builder()
                        .baseUrl(supabase.issuer())
                        .defaultHeader("apikey", supabase.secretKey())
                        .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + supabase.secretKey())
                        .build()
                : null;
    }

    /**
     * 계정을 만든다.
     *
     * <p>{@code email_confirm=true}로 만들어 메일 확인 없이 바로 로그인할 수 있게 한다. 메일 확인을
     * 요구하려면 이 값을 false로 바꾸고 안내 화면을 붙이면 된다.
     *
     * @return 만들어진 계정의 id. 우리 회원 행이 이 값을 가리킨다.
     */
    public UUID createUser(String email, String password) {
        if (!configured) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "인증 설정이 되어 있지 않아요.");
        }
        try {
            Map<?, ?> body = client.post()
                    .uri("/admin/users")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("email", email, "password", password, "email_confirm", true))
                    .retrieve()
                    .body(Map.class);

            Object id = body == null ? null : body.get("id");
            if (id == null) {
                throw new ApiException(ErrorCode.INTERNAL_ERROR);
            }
            return UUID.fromString(id.toString());

        } catch (RestClientResponseException e) {
            // Supabase 응답 원문을 그대로 내보내지 않는다. 읽을 수 있는 문구로 바꾼다.
            String raw = e.getResponseBodyAsString();
            if (raw.contains("already been registered") || raw.contains("already_exists")) {
                throw new ApiException(ErrorCode.INVALID_REQUEST, "이미 가입된 이메일이에요.");
            }
            if (raw.contains("Password should be")) {
                throw new ApiException(ErrorCode.INVALID_REQUEST, "비밀번호는 6자 이상이어야 해요.");
            }
            log.error("Supabase 계정 생성 실패: {}", raw);
            throw new ApiException(ErrorCode.INTERNAL_ERROR, e);
        }
    }

    /** 가입 도중 우리 쪽 저장이 실패했을 때, 계정만 남지 않도록 되돌린다. */
    public void deleteUser(UUID authUserId) {
        try {
            client.delete().uri("/admin/users/{id}", authUserId).retrieve().toBodilessEntity();
        } catch (RestClientResponseException e) {
            log.error("가입 되돌리기 실패. 계정이 남아 있을 수 있습니다: {}", authUserId);
        }
    }
}
