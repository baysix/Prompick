import { api } from "@/shared/api/client";
import type {
  AdminTemplate,
  AiModel,
  Capability,
  Pipeline,
  PipelineDraftStep,
  PresignedUpload,
  PublicPromptForm,
  TemplateMediaItem,
} from "../model/types";

export const adminApi = {
  templates: () => api.get<AdminTemplate[]>("/admin/templates"),
  template: (id: number) => api.get<AdminTemplate>(`/admin/templates/${id}`),
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
  publicPrompt: (id: number) => [...adminKeys.all, "public-prompt", id] as const,
  models: () => [...adminKeys.all, "models"] as const,
  pipelines: (templateId: number) => [...adminKeys.all, "pipelines", templateId] as const,
  media: (templateId: number) => [...adminKeys.all, "media", templateId] as const,
};
