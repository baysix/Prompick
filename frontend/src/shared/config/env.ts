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
 * 헤더의 가입 버튼과 로그인 화면의 가입 전환을 함께 켜고 끈다.
 *
 * 주의: 이것은 화면에서 감추는 것일 뿐이다. 백엔드의 /auth/signup 은 이 값과 무관하게
 * 열려 있어서, 주소를 아는 사람은 닫아두어도 가입할 수 있다. 정말로 막아야 하면
 * 서버에서 닫아야 한다.
 */
export const SIGNUP_OPEN = true;

/**
 * 구글 애드센스 퍼블리셔 ID.
 *
 * 빈 문자열이면 광고 스크립트를 아예 넣지 않는다. 승인 전이나 개발 중에 구글 스크립트가
 * 끼어들지 않게 하려는 것이고, 나중에 광고를 걷어낼 때도 이 값만 비우면 된다.
 */
export const ADSENSE_CLIENT = "ca-pub-8073655614342001";

/** 서비스 전역 상수 */
export const SERVICE = {
  name: "프롬픽",
  /** 플랫폼 재화 이름 */
  creditUnit: "프롬비",
  creditEmoji: "🪙",
} as const;
