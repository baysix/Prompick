"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { templateApi, templateKeys } from "@/entities/template/api/templateApi";
import { TemplateFrame } from "@/entities/template/ui/TemplateFrame";
import type { ContentType, TemplateListParams } from "@/entities/template/model/types";
import { cn } from "@/shared/lib/cn";

/**
 * 탐색.
 *
 * 필터 상태를 URL에 둔다. 사용자가 걸러 본 화면을 그대로 공유하거나 뒤로 가기로 돌아올 수 있고,
 * 검색 엔진도 각 조합을 개별 주소로 인식한다.
 */
export function ExploreView() {
  const router = useRouter();
  const params = useSearchParams();

  const contentType = (params.get("contentType") as ContentType | null) ?? undefined;
  const category = params.get("category") ?? undefined;
  const pricing = (params.get("pricing") as "ALL" | "FREE" | "PAID" | null) ?? "ALL";
  const promptOnly = params.get("promptOnly") === "true";
  const sort = (params.get("sort") as "TREND" | "LATEST" | null) ?? "TREND";

  const query: TemplateListParams = { contentType, category, pricing, promptOnly, sort };

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "" || value === "ALL" || value === "false") {
        next.delete(key);
      } else {
        next.set(key, value);
      }
      router.replace(`/explore?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  const { data: categories } = useQuery({
    queryKey: templateKeys.categories(contentType),
    queryFn: () => templateApi.categories(contentType),
  });

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError } =
    useInfiniteQuery({
      queryKey: templateKeys.list(query),
      queryFn: ({ pageParam }) => templateApi.list({ ...query, cursor: pageParam, size: 24 }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
    });

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  // 목록 끝에 다다르면 다음 페이지를 불러온다
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <main className="flex-1 pb-20">
      <div className="sticky top-14 z-10 border-b border-line bg-ground/80 backdrop-blur">
        <div className="mx-auto max-w-6xl space-y-2.5 px-4 py-3">
          <FilterGroup
            label="종류"
            options={[
              { value: "", label: "전체" },
              { value: "VIDEO", label: "영상" },
              { value: "IMAGE", label: "이미지" },
            ]}
            current={contentType ?? ""}
            onSelect={(v) => setParam("contentType", v || null)}
          />

          {categories && categories.length > 0 && (
            <FilterGroup
              label="주제"
              options={[
                { value: "", label: "전체" },
                ...categories.map((c) => ({ value: c.slug, label: c.name })),
              ]}
              current={category ?? ""}
              onSelect={(v) => setParam("category", v || null)}
            />
          )}

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
            <FilterGroup
              label="요금"
              options={[
                { value: "ALL", label: "전체" },
                { value: "FREE", label: "무료" },
                { value: "PAID", label: "유료" },
              ]}
              current={pricing}
              onSelect={(v) => setParam("pricing", v)}
            />

            <label className="flex items-center gap-1.5 text-[13px] text-ink-soft">
              <input
                type="checkbox"
                checked={promptOnly}
                onChange={(e) => setParam("promptOnly", e.target.checked ? "true" : null)}
                className="h-3.5 w-3.5 accent-[var(--color-ink)]"
              />
              프롬프트를 주는 것만
            </label>

            <FilterGroup
              label="정렬"
              options={[
                { value: "TREND", label: "인기순" },
                { value: "LATEST", label: "최신순" },
              ]}
              current={sort}
              onSelect={(v) => setParam("sort", v === "TREND" ? null : v)}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6">
        {isError ? (
          <Message title="목록을 불러오지 못했어요" body="잠시 후 다시 시도해 주세요." />
        ) : isPending ? (
          <FrameSkeletonGrid />
        ) : items.length === 0 ? (
          <Message
            title="조건에 맞는 템플릿이 없어요"
            body="필터를 줄이면 더 많이 볼 수 있어요."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
              {items.map((template, index) => (
                <TemplateFrame key={template.slug} template={template} priority={index < 6} />
              ))}
            </div>
            <div ref={sentinel} className="h-8" />
            {isFetchingNextPage && (
              <p className="py-4 text-center text-[13px] text-ink-faint">불러오는 중</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function FilterGroup({
  label,
  options,
  current,
  onSelect,
}: {
  label: string;
  options: { value: string; label: string }[];
  current: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-[12px] text-ink-faint">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => {
          const selected = current === option.value;
          return (
            <button
              key={option.value || "all"}
              type="button"
              onClick={() => onSelect(option.value)}
              aria-pressed={selected}
              className={cn(
                "rounded-sm px-2 py-1 text-[13px] transition-colors",
                selected
                  ? "bg-accent text-accent-ink"
                  : "text-ink-soft hover:bg-surface hover:text-ink",
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FrameSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i}>
          <div className="aspect-[9/16] bg-surface" />
          <div className="mt-2 h-3 w-4/5 bg-surface" />
          <div className="mt-1.5 h-2.5 w-1/2 bg-surface" />
        </div>
      ))}
    </div>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="py-20">
      <p className="text-[15px] font-medium text-ink">{title}</p>
      <p className="mt-1 text-[13px] text-ink-soft">{body}</p>
    </div>
  );
}
