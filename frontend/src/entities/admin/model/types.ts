import type { ContentType, GenerateAccess, PromptAccess } from "@/entities/template/model/types";

/** 관리자 전용 타입. 사용자 화면에서는 import하지 않는다. */

export type TemplateStatus = "DRAFT" | "PUBLISHED" | "HIDDEN";

export type AiProvider =
  | "MOCK"
  | "INTERNAL"
  | "OPENAI"
  | "ANTHROPIC"
  | "GOOGLE"
  | "XAI"
  | "BYTEDANCE"
  | "HIGGSFIELD"
  | "RUNWAY"
  | "KLING";

/**
 * 제공사 키의 상태.
 *
 * 키 원문은 이 타입 어디에도 없다. 서버가 내려주지 않으므로 프론트가 알 방법이 없다.
 * keyHint는 끝 네 자리뿐이고, 어느 키를 넣어뒀는지 구분하는 용도다.
 */
export interface ProviderKey {
  provider: AiProvider;
  displayName: string;
  /** DB에 봉인해 둔 키가 있는지 */
  stored: boolean;
  /** 설정 파일(.env)에만 있는지 */
  fromEnv: boolean;
  keyHint: string | null;
  active: boolean;
  memo: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface ProviderKeyList {
  items: ProviderKey[];
  /** 마스터 키가 있어서 화면에서 키를 저장할 수 있는 상태인지 */
  canStore: boolean;
}

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

/* ---------------------------------------------------------------------------
   운영·정산
--------------------------------------------------------------------------- */

export interface AdminUserSummary {
  id: number;
  nickname: string;
  email: string | null;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED" | "WITHDRAWN";
  identityVerified: boolean;
  creditBalance: number;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface CreditEntry {
  id: number;
  /** 양수는 들어온 것, 음수는 나간 것 */
  amount: number;
  balanceAfter: number;
  reason: string;
  reasonLabel: string;
  refType: string | null;
  refId: number | null;
  actor: string | null;
  memo: string | null;
  createdAt: string;
}

export interface AdminUserDetail {
  user: AdminUserSummary;
  totalCharged: number;
  totalSpent: number;
  credits: CreditEntry[];
}

/** 기간별 매출과 원가. 둘을 따로 보면 제작이 늘어난 게 좋은 일인지 알 수 없다 */
export interface OperationsSummary {
  days: number;
  totalJobs: number;
  paidJobs: number;
  freeJobs: number;
  failedJobs: number;
  /** 받은 프롬비 */
  revenue: number;
  /** 외부 AI에 나간 원가(원) */
  providerCost: number;
  /** 그중 무료 제작에 들어간 원가. 매출 없이 나간 돈 */
  freeCost: number;
  totalUsers: number;
  totalTemplates: number;
}

export interface AdminJobRow {
  id: number;
  userId: number;
  nickname: string;
  templateTitle: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
  chargeType: "FREE" | "PAID";
  creditCost: number;
  providerCost: number;
  errorCode: string | null;
  createdAt: string;
  finishedAt: string | null;
}

/** 요청 게시판 — 관리자용. 사용자용과 달리 작성자와 운영 메모를 함께 본다 */
export interface AdminRequestRow {
  id: number;
  title: string;
  referenceUrl: string | null;
  description: string | null;
  status: "PENDING" | "REVIEWING" | "BUILDING" | "DONE" | "REJECTED";
  statusLabel: string;
  voteCount: number;
  authorNickname: string;
  templateId: number | null;
  templateSlug: string | null;
  adminNote: string | null;
  createdAt: string;
}

export interface RequestTemplateOption {
  id: number;
  title: string;
  slug: string;
}

/** 템플릿이 받는 입력 칸. 프롬프트의 @이름에 무엇을 이을지 고를 목록 */
export interface InputFieldOption {
  fieldKey: string;
  label: string;
  /** 사진 칸인지. 사진이 아니면 프롬프트 변수로 쓰인다 */
  isPhoto: boolean;
}

/* ---------------------------------------------------------------------------
   제작 상세 — 환불 판단에 필요한 것들
--------------------------------------------------------------------------- */

export interface JobStepRow {
  index: number;
  status: string;
  /** 실패 원문. 관리자만 본다 */
  errorDetail: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface JobMoneyRow {
  id: number;
  amount: number;
  balanceAfter: number;
  reason: string;
  reasonLabel: string;
  actor: string | null;
  memo: string | null;
  createdAt: string;
}

export interface JobDetail {
  id: number;
  userId: number;
  nickname: string;
  templateTitle: string;
  status: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
  chargeType: "FREE" | "PAID";
  creditCost: number;
  errorCode: string | null;
  retryCount: number;
  createdAt: string;
  finishedAt: string | null;
  outputCount: number;
  steps: JobStepRow[];
  money: JobMoneyRow[];
  /** 이미 돌려준 적이 있는지. 이중 지급을 막는 가장 중요한 값 */
  alreadyRefunded: boolean;
  refundable: { allowed: boolean; note: string };
}

/* --- 공지사항 --- */

export interface AdminNotice {
  id: number;
  title: string;
  body: string;
  pinned: boolean;
  /** 내보냈는지. false면 작성 중이라 사용자에게 보이지 않는다 */
  published: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

export interface NoticeForm {
  title: string;
  body: string;
  pinned: boolean;
}

/* --- 오류 신고 --- */

export type BugReportStatus = "OPEN" | "CONFIRMED" | "FIXED" | "NOT_A_BUG" | "DUPLICATE";

export interface AdminBugReport {
  id: number;
  /** 신고한 사람. 이메일은 내려오지 않는다 */
  nickname: string;
  title: string;
  body: string;
  /** 어느 화면이었는지. 신고 화면이 자동으로 채운 값이다 */
  pageUrl: string | null;
  userAgent: string | null;
  status: BugReportStatus;
  statusLabel: string;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}
