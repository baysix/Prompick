/**
 * 환경 설정.
 *
 * 주의: 외부 AI API 키는 절대 프론트엔드에 두지 않는다.
 * 프론트는 우리 백엔드만 호출하고, 외부 AI 호출은 백엔드에서만 한다. (PRD 2-3 규칙 3번)
 */
export const env = {
  /** 브라우저에서 호출할 백엔드 주소 */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1",
  /** 서버 컴포넌트에서 호출할 백엔드 주소 (컨테이너 내부 주소가 다를 수 있음) */
  serverApiBaseUrl:
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://localhost:8080/api/v1",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

/**
 * 가입을 열어둘지.
 *
 * 잠시 닫아둔 상태다. 다시 열 때는 이 값 하나만 true 로 바꾸면 헤더의 가입 버튼과
 * 로그인 화면의 가입 전환이 함께 돌아온다.
 *
 * 주의: 이것은 화면에서 감추는 것일 뿐이다. 백엔드의 /auth/signup 은 그대로 열려 있어서,
 * 주소를 아는 사람은 여전히 가입할 수 있다. 정말로 막아야 하면 서버에서 닫아야 한다.
 */
export const SIGNUP_OPEN = false;

/** 서비스 전역 상수 */
export const SERVICE = {
  name: "프롬픽",
  /** 플랫폼 재화 이름 */
  creditUnit: "프롬비",
  creditEmoji: "🪙",
} as const;
