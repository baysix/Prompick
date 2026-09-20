import { api } from "@/shared/api/client";
import type { TemplateRequest } from "../model/types";

export const requestApi = {
  /** 목록은 로그인 없이도 볼 수 있다 */
  list: (sort: "VOTES" | "LATEST", onlyOpen: boolean) =>
    api.get<TemplateRequest[]>(`/requests?sort=${sort}&onlyOpen=${onlyOpen}`),

  create: (body: { title: string; referenceUrl: string | null; description: string | null }) =>
    api.post<TemplateRequest>("/requests", body),

  vote: (id: number) => api.post<{ voted: boolean }>(`/requests/${id}/vote`),

  remove: (id: number) => api.delete<void>(`/requests/${id}`),
};

export const requestKeys = {
  all: ["requests"] as const,
  list: (sort: string, onlyOpen: boolean) => [...requestKeys.all, sort, onlyOpen] as const,
};
