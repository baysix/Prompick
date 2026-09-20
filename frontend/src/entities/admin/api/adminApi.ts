import { api } from "@/shared/api/client";
import type {
  AdminTemplate,
  AiModel,
  Capability,
  Pipeline,
  PipelineDraftStep,
  AdminJobRow,
  AdminRequestRow,
  AdminUserDetail,
  AdminUserSummary,
  OperationsSummary,
  InputFieldOption,
  JobDetail,
  PresignedUpload,
  ProviderKey,
  RequestTemplateOption,
  ProviderKeyList,
  PublicPromptForm,
  TemplateMediaItem,
} from "../model/types";

export const adminApi = {
  templates: () => api.get<AdminTemplate[]>("/admin/templates"),
  template: (id: number) => api.get<AdminTemplate>(`/admin/templates/${id}`),

  /** 서비스 화면에서 보던 템플릿을 편집하러 갈 때. 그쪽은 id를 모르고 주소만 안다 */
  templateBySlug: (slug: string) =>
    api.get<AdminTemplate>(`/admin/templates/by-slug/${slug}`),
  createTemplate: (form: unknown) => api.post<AdminTemplate>("/admin/templates", form),
  updateTemplate: (id: number, form: unknown) =>
    api.put<AdminTemplate>(`/admin/templates/${id}`, form),
  publish: (id: number) => api.post<AdminTemplate>(`/admin/templates/${id}/publish`),
  unpublish: (id: number) => api.post<AdminTemplate>(`/admin/templates/${id}/unpublish`),

  publicPrompt: (id: number) => api.get<PublicPromptForm>(`/admin/templates/${id}/public-prompt`),
  savePublicPrompt: (id: number, form: PublicPromptForm) =>
    api.put<PublicPromptForm>(`/admin/templates/${id}/public-prompt`, form),

  /** 파이프라인에서 고를 수 있는 모델 (켜둔 것만) */
  models: (capability?: Capability) =>
    api.get<AiModel[]>(`/admin/ai-models${capability ? `?capability=${capability}` : ""}`),

  /** 관리 화면용. 꺼둔 모델까지 전부 */
  modelsAll: () => api.get<AiModel[]>("/admin/ai-models?activeOnly=false"),

  configureModel: (id: number, body: { active: boolean; unitCostKrw?: number; memo?: string }) =>
    api.patch<AiModel>(`/admin/ai-models/${id}`, body),

  users: (q?: string) =>
    api.get<AdminUserSummary[]>(`/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),

  user: (id: number) => api.get<AdminUserDetail>(`/admin/users/${id}`),

  adjustCredits: (id: number, body: { amount: number; memo: string | null }) =>
    api.post<AdminUserDetail>(`/admin/users/${id}/credits`, body),

  changeUserStatus: (id: number, status: string) =>
    api.patch<AdminUserSummary>(`/admin/users/${id}/status`, { status }),

  operationsSummary: (days: number) =>
    api.get<OperationsSummary>(`/admin/operations/summary?days=${days}`),

  jobDetail: (id: number) => api.get<JobDetail>(`/admin/operations/jobs/${id}`),

  refundJob: (id: number, reason: string) =>
    api.post<JobDetail>(`/admin/operations/jobs/${id}/refund`, { reason }),

  operationsJobs: (status?: string) =>
    api.get<AdminJobRow[]>(`/admin/operations/jobs${status ? `?status=${status}` : ""}`),

  requests: (status?: string) =>
    api.get<AdminRequestRow[]>(`/admin/requests${status ? `?status=${status}` : ""}`),

  requestTemplateOptions: () =>
    api.get<RequestTemplateOption[]>("/admin/requests/templates"),

  changeRequestStatus: (
    id: number,
    body: { status: string; templateId: number | null; adminNote: string | null },
  ) => api.patch<AdminRequestRow>(`/admin/requests/${id}`, body),

  providerKeys: () => api.get<ProviderKeyList>("/admin/provider-keys"),

  saveProviderKey: (provider: string, body: { apiKey: string; memo: string | null }) =>
    api.put<ProviderKey>(`/admin/provider-keys/${provider}`, body),

  setProviderKeyActive: (provider: string, active: boolean) =>
    api.patch<ProviderKey>(`/admin/provider-keys/${provider}`, { active }),

  deleteProviderKey: (provider: string) =>
    api.delete<ProviderKey>(`/admin/provider-keys/${provider}`),

  media: (templateId: number) =>
    api.get<TemplateMediaItem[]>(`/admin/templates/${templateId}/media`),

  presignMedia: (templateId: number, body: { fileName: string; contentType: string }) =>
    api.post<PresignedUpload>(`/admin/templates/${templateId}/media/presign`, body),

  registerMedia: (templateId: number, body: { storageKey: string }) =>
    api.post<TemplateMediaItem>(`/admin/templates/${templateId}/media`, body),

  deleteMedia: (templateId: number, mediaId: number) =>
    api.delete<void>(`/admin/templates/${templateId}/media/${mediaId}`),

  pipelines: (templateId: number) =>
    api.get<Pipeline[]>(`/admin/templates/${templateId}/pipelines`),

  inputFields: (templateId: number) =>
    api.get<InputFieldOption[]>(`/admin/templates/${templateId}/pipelines/input-fields`),

  savePipeline: (
    templateId: number,
    body: { steps: PipelineDraftStep[]; adminMemo: string | null; activate: boolean },
  ) => api.post<Pipeline>(`/admin/templates/${templateId}/pipelines`, body),

  activatePipeline: (templateId: number, pipelineId: number) =>
    api.post<Pipeline>(`/admin/templates/${templateId}/pipelines/${pipelineId}/activate`),
};

export const adminKeys = {
  all: ["admin"] as const,
  templates: () => [...adminKeys.all, "templates"] as const,
  template: (id: number) => [...adminKeys.all, "template", id] as const,
  templateBySlug: (slug: string) => [...adminKeys.all, "template-slug", slug] as const,
  publicPrompt: (id: number) => [...adminKeys.all, "public-prompt", id] as const,
  models: () => [...adminKeys.all, "models"] as const,
  providerKeys: () => [...adminKeys.all, "provider-keys"] as const,
  users: (q?: string) => [...adminKeys.all, "users", q ?? ""] as const,
  user: (id: number) => [...adminKeys.all, "user", id] as const,
  operations: (days: number) => [...adminKeys.all, "operations", days] as const,
  operationJobs: (status?: string) => [...adminKeys.all, "op-jobs", status ?? "ALL"] as const,
  jobDetail: (id: number) => [...adminKeys.all, "job", id] as const,
  requests: (status?: string) => [...adminKeys.all, "requests", status ?? "ALL"] as const,
  requestTemplates: () => [...adminKeys.all, "request-templates"] as const,
  pipelines: (templateId: number) => [...adminKeys.all, "pipelines", templateId] as const,
  inputFields: (templateId: number) => [...adminKeys.all, "input-fields", templateId] as const,
  media: (templateId: number) => [...adminKeys.all, "media", templateId] as const,
};
