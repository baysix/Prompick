import { env } from "@/shared/config/env";

/** 백엔드 공통 에러 응답 형식 (PRD 11장) */
export interface ApiErrorBody {
  code: string;
  message: string;
  errors?: { field: string; message: string }[];
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: { field: string; message: string }[];

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = status;
    this.code = body.code;
    this.fieldErrors = body.errors;
  }

  /** 로그인이 필요한 상황인지 */
  get needsLogin() {
    return this.status === 401;
  }

  /** 프롬비가 부족한 상황인지 */
  get needsCredit() {
    return this.code === "INSUFFICIENT_CREDIT";
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** 멱등 키. 생성 요청처럼 중복 실행되면 안 되는 호출에 쓴다. */
  idempotencyKey?: string;
};

/**
 * 액세스 토큰을 가져오는 함수.
 *
 * 인증 구현(Supabase)을 이 파일이 직접 알지 않게 하려고 주입받는다. 나중에 인증 방식을 바꿔도
 * 이 파일은 그대로 둘 수 있다.
 */
type TokenProvider = () => Promise<string | null>;

let getToken: TokenProvider = async () => null;

export function setTokenProvider(provider: TokenProvider) {
  getToken = provider;
}

/**
 * 서버에서 화면을 그릴 때 백엔드를 기다려 주는 시간.
 *
 * 이 값이 없으면 백엔드가 "연결은 받고 응답은 안 주는" 상태일 때 fetch 가 영원히 끝나지
 * 않는다. 화면마다 try/catch 를 붙여놔도 소용이 없다 — 거부되지 않으니 catch 가 돌 기회가
 * 없고, 결국 사용자는 백지를 본다. 실제로 그렇게 사이트 전체가 안 뜬 적이 있다.
 *
 * 8초로 둔다. 정상이면 100ms 안에 끝나는 호출이라 넉넉하고, 사람이 백지를 참아주는
 * 시간보다는 짧다. 넘기면 ApiError 로 바뀌어 각 화면이 준비해 둔 대체 화면이 나온다.
 */
const SERVER_TIMEOUT_MS = 8_000;

/**
 * 브라우저에서 기다려 주는 시간.
 *
 * 서버보다 길게 둔다. 제작 요청처럼 사용자가 결과를 기다리는 호출이 있고, 이쪽은 화면에
 * 이미 "보내는 중"이 떠 있어 사용자가 무슨 일이 일어나는지 안다.
 */
const BROWSER_TIMEOUT_MS = 30_000;

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, idempotencyKey, headers, ...rest } = options;
  const onServer = typeof window === "undefined";
  const baseUrl = onServer ? env.serverApiBaseUrl : env.apiBaseUrl;

  // 서버 컴포넌트에서는 로그인 상태가 없다. 공개 조회만 하므로 토큰 없이 보낸다.
  const token = onServer ? null : await getToken();

  const res = await fetchWithTimeout(`${baseUrl}${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // 리프레시 토큰이 HttpOnly 쿠키라 항상 쿠키를 함께 보낸다.
    credentials: "include",
    // 캐시를 거치지 않는다.
    //
    // 서버에서는 Next 의 데이터 캐시를, 브라우저에서는 HTTP 캐시를 건너뛴다. 관리자가
    // 템플릿을 고쳤는데 화면에는 옛것이 보이는 일을 막는 것이 이 서비스에서는 더 중요하다.
    // 남은 캐시는 각 화면의 렌더 캐시와 react-query 뿐이고, 그쪽도 함께 풀어두었다.
    cache: "no-store",
  }, onServer ? SERVER_TIMEOUT_MS : BROWSER_TIMEOUT_MS);

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  const parsed = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const fallback: ApiErrorBody = {
      code: "INTERNAL_ERROR",
      message: "일시적인 오류가 발생했어요. 잠시 후 다시 시도해주세요.",
    };
    throw new ApiError(res.status, (parsed as ApiErrorBody) ?? fallback);
  }

  return parsed as T;
}

/**
 * 제한 시간을 건 fetch.
 *
 * 시간이 지나면 요청을 끊고 ApiError 로 바꾼다. 네트워크가 끊긴 경우(TypeError)도 함께
 * 여기서 받아 같은 모양으로 만든다 — 화면 입장에서는 "못 불러왔다"는 사실만 같으면 되고,
 * 원인별로 다른 예외가 올라가면 화면마다 다 처리해야 한다.
 */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (e) {
    const timedOut = e instanceof DOMException && e.name === "TimeoutError";
    throw new ApiError(timedOut ? 504 : 503, {
      code: timedOut ? "GATEWAY_TIMEOUT" : "NETWORK_ERROR",
      message: "지금 불러오지 못했어요. 잠시 후 다시 시도해주세요.",
    });
  }
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: "GET" }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
};
