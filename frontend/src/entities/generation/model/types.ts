import type { ContentType } from "@/entities/template/model/types";

export type JobStatus = "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED" | "CANCELED";

export interface JobOutput {
  id: number;
  mediaType: ContentType;
  /** 짧은 만료의 서명 주소. 화면에 바로 쓸 수 있다 */
  url: string;
  watermarked: boolean;
  expiresAt: string | null;
}

/**
 * 제작 작업.
 *
 * 어떤 AI를 쓰는지, 어떤 프롬프트로 도는지는 여기 없다. 서버가 내려주지 않는다.
 */
export interface Job {
  id: number;
  status: JobStatus;
  templateSlug: string | null;
  templateTitle: string;
  chargeType: "FREE" | "PAID";
  creditCost: number;
  currentStep: number;
  totalSteps: number;
  /** 화면에 그대로 보여줄 문구 */
  statusMessage: string;
  errorCode: string | null;
  outputs: JobOutput[];
  createdAt: string;
  finishedAt: string | null;
}

export interface PresignedUpload {
  uploadId: number;
  url: string;
  method: string;
  headers: Record<string, string>;
}

export type UploadCheckStatus = "PENDING" | "PASSED" | "WARNED" | "BLOCKED";

export interface UploadCheck {
  uploadId: number;
  status: UploadCheckStatus;
  /** 항목별 안내 문구 */
  messages: Record<string, string>;
}

export interface FreeUsage {
  remaining: number;
  dailyLimit: number;
  identityVerified: boolean;
}

/** 작업이 끝났는지. 끝나면 상태 확인을 멈춘다 */
export function isFinished(status: JobStatus): boolean {
  return status === "SUCCEEDED" || status === "FAILED" || status === "CANCELED";
}
