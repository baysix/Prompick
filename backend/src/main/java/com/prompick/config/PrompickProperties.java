package com.prompick.config;

import java.util.List;
import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 운영 설정값. PRD 15장 미결정 항목을 코드에 박지 않고 여기로 모은다.
 *
 * <p>정책이 바뀌면 application.yml 또는 환경변수만 고치면 된다.
 */
@ConfigurationProperties(prefix = "prompick")
public record PrompickProperties(
        Credit credit,
        Free free,
        Output output,
        Upload upload,
        Storage storage,
        Supabase supabase,
        Ai ai,
        Cors cors) {

    /** 재화(프롬비) 설정 */
    public record Credit(
            String unitName,
            int signupBonus,
            /** 유료 템플릿의 프롬프트 열람 기본 가격 */
            int defaultPromptCost,
            /** 유료 템플릿의 자동 제작 기본 가격 */
            int defaultGenerateCost) {}

    /** 무료 이용 정책 */
    public record Free(
            int dailyGenerateLimit, boolean watermark, boolean requireIdentityVerification) {}

    /** 결과물 보관 정책 */
    public record Output(int retentionDays) {}

    /** 업로드 제한 */
    public record Upload(int maxSizeMb, List<String> allowedMimeTypes) {
        public long maxSizeBytes() {
            return (long) maxSizeMb * 1024 * 1024;
        }
    }

    /** 파일 저장소 선택 */
    public record Storage(Type type, Local local, long signedUrlTtlSeconds) {
        public enum Type {
            /** 로컬 디스크. 네트워크 없이 개발할 때 */
            LOCAL,
            /** Supabase Storage. 기본값 */
            SUPABASE
        }

        public record Local(String basePath, String publicBaseUrl) {}
    }

    /**
     * Supabase 연동 설정.
     *
     * <p>secretKey({@code sb_secret_...})는 RLS를 통째로 무시하는 키다. 서버에서만 쓰고 절대 프론트엔드로
     * 내보내지 않는다. 프론트엔드에는 publishable key({@code sb_publishable_...})만 둔다.
     */
    public record Supabase(
            String url, String secretKey, String jwtSecret, StorageBuckets storage) {

        public boolean isConfigured() {
            return url != null && !url.isBlank();
        }

        /** 예전 방식(HS256 대칭키)으로 서명된 토큰을 쓰는 프로젝트인지 */
        public boolean usesLegacyJwtSecret() {
            return jwtSecret != null && !jwtSecret.isBlank();
        }

        /** 토큰의 issuer. 다른 Supabase 프로젝트의 토큰을 거르기 위해 반드시 검증한다. */
        public String issuer() {
            return trimTrailingSlash(url) + "/auth/v1";
        }

        /** Supabase Auth가 발급한 JWT의 서명을 검증할 공개키 주소 */
        public String jwksUri() {
            return trimTrailingSlash(url) + "/auth/v1/.well-known/jwks.json";
        }

        public String storageApiUrl() {
            return trimTrailingSlash(url) + "/storage/v1";
        }

        private static String trimTrailingSlash(String value) {
            return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
        }

        public record StorageBuckets(String uploadBucket, String outputBucket, String publicBucket) {}
    }

    /**
     * 외부 AI 제공사 연동 설정.
     *
     * <p>키는 환경변수로만 넣는다. 저장소에 올라가면 그 키는 이미 유출된 것으로 봐야 한다.
     */
    public record Ai(
            /** 제공사 키를 봉인할 마스터 키. base64로 인코딩한 32바이트 */
            String masterKey,
            /**
             * 환경변수로 직접 넣은 제공사 키.
             *
             * <p>관리자 화면에서 넣은 값이 우선이고, 여기는 아직 화면에 넣지 않았을 때의 대비책이다.
             * 로컬 개발이나, DB가 비어 있는 첫 배포에서 쓴다.
             */
            Map<String, String> keys,
            OpenAi openai) {

        public record OpenAi(String baseUrl, int timeoutSeconds) {}
    }

    public record Cors(List<String> allowedOrigins) {}
}
