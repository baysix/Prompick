import { api } from "@/shared/api/client";
import type {
  Category,
  ContentType,
  CursorPage,
  HomeData,
  TemplateCard,
  TemplateDetail,
  TemplateListParams,
} from "../model/types";

function toQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "" && value !== false) {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export const templateApi = {
  home: () => api.get<HomeData>("/home"),

  categories: (contentType?: ContentType) =>
    api.get<Category[]>(`/categories${toQuery({ contentType })}`),

  list: (params: TemplateListParams = {}) =>
    api.get<CursorPage<TemplateCard>>(`/templates${toQuery({ ...params })}`),

  search: (query: string) =>
    api.get<TemplateCard[]>(`/templates/search${toQuery({ q: query })}`),

  detail: (slug: string) => api.get<TemplateDetail>(`/templates/${slug}`),
};

/** TanStack Query 키. 한곳에 모아 무효화 범위를 명확히 한다 */
export const templateKeys = {
  all: ["templates"] as const,
  home: () => [...templateKeys.all, "home"] as const,
  categories: (contentType?: ContentType) =>
    [...templateKeys.all, "categories", contentType ?? "ALL"] as const,
  list: (params: TemplateListParams) => [...templateKeys.all, "list", params] as const,
  search: (query: string) => [...templateKeys.all, "search", query] as const,
  detail: (slug: string) => [...templateKeys.all, "detail", slug] as const,
};
