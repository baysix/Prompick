import { api } from "@/shared/api/client";
import type {
  FreeUsage,
  Job,
  JobStatus,
  PresignedUpload,
  UploadCheck,
} from "../model/types";

export const generationApi = {
  freeUsage: () => api.get<FreeUsage>("/me/free-usage"),

  presign: (fileName: string, contentType: string) =>
    api.post<PresignedUpload>("/uploads/presign", { fileName, contentType }),

  check: (uploadId: number, validation?: { minWidth?: number; minHeight?: number }) =>
    api.post<UploadCheck>(`/uploads/${uploadId}/check`, validation ?? {}),

  /**
   * 제작을 요청한다.
   *
   * 멱등 키를 반드시 보낸다. 같은 키로 두 번 오면 서버가 작업을 하나만 만든다 —
   * 버튼을 두 번 누르거나 새로고침해도 프롬비가 두 번 나가지 않는다.
   */
  create: (templateSlug: string, inputs: Record<string, unknown>, idempotencyKey: string) =>
    api.post<Job>("/jobs", { templateSlug, inputs }, { idempotencyKey }),

  job: (jobId: number) => api.get<Job>(`/jobs/${jobId}`),

  jobs: (status?: JobStatus) =>
    api.get<Job[]>(`/jobs${status ? `?status=${status}` : ""}`),

  deleteOutputs: (jobId: number) => api.delete<void>(`/jobs/${jobId}/outputs`),
};

export const generationKeys = {
  all: ["generation"] as const,
  freeUsage: () => [...generationKeys.all, "free-usage"] as const,
  job: (jobId: number) => [...generationKeys.all, "job", jobId] as const,
  jobs: (status?: JobStatus) => [...generationKeys.all, "jobs", status ?? "ALL"] as const,
};

/**
 * 스토리지로 파일을 직접 올린다.
 *
 * 파일이 우리 백엔드를 거치지 않는다. 수십 MB가 서버 메모리를 지나가지 않게 하려는 구조다.
 */
export async function uploadDirect(presigned: PresignedUpload, file: File): Promise<void> {
  const res = await fetch(presigned.url, {
    method: presigned.method,
    headers: presigned.headers,
    body: file,
  });
  if (!res.ok) {
    throw new Error("사진을 올리지 못했어요. 잠시 후 다시 시도해주세요.");
  }
}
