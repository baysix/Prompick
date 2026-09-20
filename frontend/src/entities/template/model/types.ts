/**
 * 백엔드 응답 타입.
 *
 * 여기에 파이프라인 관련 타입은 없다. 서버가 내려주지 않으므로 프론트가 알 수도 없다.
 * 사용자는 어떤 AI가 쓰였는지 알 필요가 없고, 알 수단도 없어야 한다.
 */

export type ContentType = "IMAGE" | "VIDEO" | "AUDIO";

/** 프롬프트 원문을 어떻게 제공하는지 */
export type PromptAccess = "FREE" | "PAID" | "HIDDEN";

/** 자동 제작을 어떻게 제공하는지 */
export type GenerateAccess = "FREE" | "PAID";

export interface TemplateCard {
  slug: string;
  title: string;
  contentType: ContentType;
  categoryName: string;
  previewUrl: string | null;
  thumbnailUrl: string | null;
  requiredPhotoSummary: string | null;
  /** 템플릿이 만들어내는 결과물의 비율 (예: "9:16") */
  ratio: string;
  /**
   * 예시 그림의 실제 비율 (예: "281 / 352").
   *
   * 목록에서 타일 자리를 이 값으로 잡는다. 운영자가 올린 그림이 잘리지 않게 하려는 것이다.
   * 크기를 읽지 못한 예시는 null이고, 그때는 ratio로 대신한다.
   */
  mediaRatio: string | null;
  promptAccess: PromptAccess;
  promptCost: number;
  generateAccess: GenerateAccess;
  generateCost: number;
  generationCount: number;
}

export interface PublicPrompt {
  body: string;
  negativePrompt: string | null;
  recommendedTool: string | null;
  usageTip: string | null;
}

export interface TemplateDetail {
  slug: string;
  title: string;
  description: string | null;
  contentType: ContentType;
  categoryName: string;
  categorySlug: string;
  tags: string[];
  media: {
    mediaType: ContentType;
    url: string | null;
    previewUrl: string | null;
    thumbnailUrl: string | null;
  }[];
  output: {
    durationSeconds: number | null;
    resolution: string | null;
    ratio: string;
  };
  estimatedSeconds: number;
  requiredPhotoSummary: string | null;
  uploadGuide: {
    checklist?: string[];
    resultNote?: string;
  };
  inputFields: {
    fieldKey: string;
    fieldType: "IMAGE" | "SELECT" | "TEXT";
    label: string;
    helpText: string | null;
    required: boolean;
    options: { value: string; label: string }[];
    validation: Record<string, unknown>;
  }[];
  promptAccess: PromptAccess;
  promptCost: number;
  generateAccess: GenerateAccess;
  generateCost: number;
  /** 공개 조건을 만족할 때만 채워진다 */
  prompt: PublicPrompt | null;
  generationCount: number;
  favoriteCount: number;
}

export interface HomeSection {
  key: string;
  title: string;
  subtitle: string | null;
  items: TemplateCard[];
}

export interface HomeData {
  sections: HomeSection[];
}

export interface Category {
  slug: string;
  name: string;
  contentType: ContentType;
}

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
  hasNext: boolean;
}

/** 탐색 필터 */
export interface TemplateListParams {
  contentType?: ContentType;
  category?: string;
  pricing?: "ALL" | "FREE" | "PAID";
  /** 프롬프트를 제공하는 템플릿만 */
  promptOnly?: boolean;
  ratio?: string;
  sort?: "TREND" | "LATEST";
  cursor?: string;
  size?: number;
}
