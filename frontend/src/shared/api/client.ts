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

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, idempotencyKey, headers, ...rest } = options;
  const baseUrl = typeof window === "undefined" ? env.serverApiBaseUrl : env.apiBaseUrl;

  const res = await fetch(`${baseUrl}${path}`, {
    ...rest,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // 리프레시 토큰이 HttpOnly 쿠키라 항상 쿠키를 함께 보낸다.
    credentials: "include",
  });

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
