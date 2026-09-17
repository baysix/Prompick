import type { ContentType, GenerateAccess, PromptAccess } from "@/entities/template/model/types";

/** 관리자 전용 타입. 사용자 화면에서는 import하지 않는다. */

export type TemplateStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";

export type AiProvider =
  | "MOCK"
  | "INTERNAL"
  | "OPENAI"
  | "GOOGLE"
  | "HIGGSFIELD"
  | "RUNWAY"
  | "KLING";

/** 모델이 담당하는 단계 유형 */
export type Capability = "TEXT" | "VISION" | "IMAGE" | "IMAGE_EDIT" | "VIDEO" | "AUDIO";

export interface AiModel {
  id: number;
  provider: AiProvider;
  modelKey: string;
  displayName: string;
  capability: Capability;
  /** 1회 호출 원가(원). 마진 계산용 */
  unitCostKrw: number;
  paramSchema: Record<string, ParamSpec>;
  active: boolean;
  memo: string | null;
}

export interface ParamSpec {
  type: "select" | "number" | "text";
  options?: string[];
  min?: number;
  max?: number;
}

export interface AdminTemplate {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  contentType: ContentType;
  categorySlug: string;
  categoryName: string;
  status: TemplateStatus;
  promptAccess: PromptAccess;
  promptCost: number;
  generateAccess: GenerateAccess;
  generateCost: number;
  ratio: string;
  durationSeconds: number | null;
  resolution: string | null;
  estimatedSeconds: number;
  requiredPhotoSummary: string | null;
  uploadGuide: { checklist?: string[]; resultNote?: string };
  tags: string[];
  pinned: boolean;
  hasPublicPrompt: boolean;
  hasActivePipeline: boolean;
  mediaCount: number;
  generationCount: number;
}

/** 템플릿 등록·수정 폼 값. 백엔드 TemplateForm과 짝을 이룬다 */
export interface TemplateFormValues {
  slug: string;
  title: string;
  description: string;
  contentType: ContentType;
  categorySlug: string;
  promptAccess: PromptAccess;
  promptCost: number;
  generateAccess: GenerateAccess;
  generateCost: number;
  ratio: string;
  durationSeconds: number | null;
  resolution: string | null;
  estimatedSeconds: number;
  requiredPhotoSummary: string;
  uploadGuide: { checklist?: string[]; resultNote?: string };
  tags: string[];
  pinned: boolean;
}

export const EMPTY_TEMPLATE_FORM: TemplateFormValues = {
  slug: "",
  title: "",
  description: "",
  contentType: "VIDEO",
  categorySlug: "",
  promptAccess: "HIDDEN",
  promptCost: 0,
  generateAccess: "PAID",
  generateCost: 100,
  ratio: "9:16",
  durationSeconds: 5,
  resolution: "1080x1920",
  estimatedSeconds: 120,
  requiredPhotoSummary: "",
  uploadGuide: {},
  tags: [],
  pinned: false,
};

/** 서버가 준 템플릿을 폼 값으로 바꾼다 */
export function toFormValues(t: AdminTemplate): TemplateFormValues {
  return {
    slug: t.slug,
    title: t.title,
    description: t.description ?? "",
    contentType: t.contentType,
    categorySlug: t.categorySlug,
    promptAccess: t.promptAccess,
    promptCost: t.promptCost,
    generateAccess: t.generateAccess,
    generateCost: t.generateCost,
    ratio: t.ratio,
    durationSeconds: t.durationSeconds,
    resolution: t.resolution,
    estimatedSeconds: t.estimatedSeconds,
    requiredPhotoSummary: t.requiredPhotoSummary ?? "",
    uploadGuide: t.uploadGuide,
    tags: t.tags,
    pinned: t.pinned,
  };
}

export interface PublicPromptForm {
  body: string;
  negativePrompt: string | null;
  recommendedTool: string | null;
  usageTip: string | null;
}

/** 파이프라인 한 단계 */
export interface PipelineStepView {
  index: number;
  type: string;
  modelId: number | null;
  modelProvider: string | null;
  modelDisplayName: string;
  modelUnitCostKrw: number;
  prompt: string | null;
  params: Record<string, unknown>;
  inputs: Record<string, string>;
}

export interface Pipeline {
  id: number;
  templateId: number;
  version: number;
  active: boolean;
  steps: PipelineStepView[];
  adminMemo: string | null;
  /** 이 파이프라인 1회 실행 원가 합계(원) */
  estimatedCostKrw: number;
}

/** 파이프라인 저장 요청 */
export interface PipelineDraftStep {
  type: string;
  modelId: number | null;
  prompt: string;
  params: Record<string, unknown>;
  inputs: Record<string, string>;
}

/** 단계 유형. 어떤 능력의 모델을 고를 수 있는지 함께 정한다 */
export const STEP_TYPES: { value: string; label: string; capability: Capability }[] = [
  { value: "PREPROCESS", label: "사진 다듬기", capability: "IMAGE_EDIT" },
  { value: "ANALYZE", label: "사진 분석하기", capability: "VISION" },
  { value: "COMPOSE_PROMPT", label: "프롬프트 만들기", capability: "TEXT" },
  { value: "GENERATE_IMAGE", label: "이미지 만들기", capability: "IMAGE" },
  { value: "GENERATE_VIDEO", label: "영상 만들기", capability: "VIDEO" },
  { value: "GENERATE_AUDIO", label: "소리 만들기", capability: "AUDIO" },
];

/** 등록된 예시 결과물 */
export interface TemplateMediaItem {
  id: number;
  mediaType: ContentType;
  storageKey: string;
  url: string;
  sortOrder: number;
}

/** 스토리지로 직접 올릴 주소 */
export interface PresignedUpload {
  storageKey: string;
  url: string;
  method: string;
  headers: Record<string, string>;
}
