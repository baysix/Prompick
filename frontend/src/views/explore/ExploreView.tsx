"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { templateApi, templateKeys } from "@/entities/template/api/templateApi";
import type { ContentType, TemplateListParams } from "@/entities/template/model/types";
import { cn } from "@/shared/lib/cn";
import { MasonryGrid } from "@/widgets/showcase/MasonryGrid";

/**
 * 탐색.
 *
 * 필터 상태를 주소에 둔다. 걸러 본 화면을 그대로 공유하거나 뒤로 가기로 돌아올 수 있고,
 * 검색 엔진도 각 조합을 개별 주소로 인식한다.
 *
 * 필터가 한 줄에 아홉 개 늘어서 있으면 어디까지가 한 묶음인지 읽히지 않는다. 그래서
 * 무엇을 볼지(영상·이미지)는 한 덩어리로 묶고, 그 밖의 조건은 옆에 떼어 둔다. 정렬은
 * 성격이 달라 오른쪽 끝으로 보낸다 — 무엇을 볼지 정한 다음에 손대는 것이다.
 */
const TYPES = [
  { value: "", label: "전체" },
  { value: "VIDEO", label: "영상" },
  { value: "IMAGE", label: "이미지" },
] as const;

const PRICING = [
  { value: "ALL", label: "전체" },
  { value: "FREE", label: "무료" },
  { value: "PAID", label: "유료" },
] as const;

const SORTS = [
  { value: "TREND", label: "인기순" },
  { value: "LATEST", label: "최신순" },
] as const;

/** 무엇을 보고 있는 화면인지. 제목이 없으면 어디에 있는지 알 수 없다 */
const HEADINGS: Record<string, { title: string; body: string }> = {
  VIDEO: {
    title: "영상",
    body: "릴스·쇼츠에 그대로 올릴 수 있는 세로 영상이에요.",
  },
  IMAGE: {
    title: "이미지",
    body: "상세페이지나 프로필 사진으로 쓸 한 장짜리 결과물이에요.",
  },
  "": {
    title: "둘러보기",
    body: "유행하는 AI 영상과 이미지를 모았어요. 마음에 드는 걸 누르면 바로 만들 수 있어요.",
  },
};

export function ExploreView() {
  const router = useRouter();
  const params = useSearchParams();

  const contentType = (params.get("contentType") as ContentType | null) ?? undefined;
  const pricing = (params.get("pricing") as "ALL" | "FREE" | "PAID" | null) ?? "ALL";
  const promptOnly = params.get("promptOnly") === "true";
  const sort = (params.get("sort") as "TREND" | "LATEST" | null) ?? "TREND";

  const query: TemplateListParams = { contentType, pricing, promptOnly, sort };

  /** 종류만 남기고 나머지 조건을 턴다 */
  function clearConditions() {
    router.replace(contentType ? `/explore?contentType=${contentType}` : "/explore", {
      scroll: false,
    });
  }

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "ALL" || value === "false") next.delete(key);
    else next.set(key, value);
    router.replace(`/explore?${next.toString()}`, { scroll: false });
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError } =
    useInfiniteQuery({
      queryKey: templateKeys.list(query),
      queryFn: ({ pageParam }) => templateApi.list({ ...query, cursor: pageParam, size: 30 }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
    });

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  // 목록 끝에 다다르면 다음 쪽을 불러온다
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const heading = HEADINGS[contentType ?? ""];
  const filtered = pricing !== "ALL" || promptOnly || sort !== "TREND";

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-[1280px] px-4 pb-6 pt-10">
        <h1 className="text-[30px] font-bold leading-tight tracking-[-0.045em] text-ink sm:text-[38px]">
          {heading.title}
        </h1>
        <p className="mt-2.5 max-w-xl text-[14px] leading-relaxed text-ink-soft sm:text-[15px]">
          {heading.body}
        </p>
      </div>

      {/* 상단바가 좁은 화면에서는 두 줄이라, 붙는 높이도 그만큼 내려간다 */}
      <div className="sticky top-[109px] z-30 border-y border-line bg-ground/90 backdrop-blur-xl md:top-16">
        <div className="scroll-row mx-auto flex max-w-[1280px] items-center gap-2 overflow-x-auto px-4 py-2.5">
          <Segmented
            options={TYPES}
            value={contentType ?? ""}
            onChange={(value) => setParam("contentType", value)}
            label="종류"
          />

          <Divider />

          <Segmented
            options={PRICING}
            value={pricing}
            onChange={(value) => setParam("pricing", value)}
            label="요금"
          />

          <button
            type="button"
            onClick={() => setParam("promptOnly", promptOnly ? null : "true")}
            aria-pressed={promptOnly}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-1.5 text-[13px] transition-colors",
              promptOnly
                ? "border-accent bg-accent/12 font-semibold text-accent"
                : "border-line text-ink-soft hover:text-ink",
            )}
          >
            프롬프트 주는 것만
          </button>

          <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
            {filtered && (
              <button
                type="button"
                onClick={clearConditions}
                className="hidden text-[13px] text-ink-faint transition-colors hover:text-ink sm:block"
              >
                조건 지우기
              </button>
            )}
            <Segmented
              options={SORTS}
              value={sort}
              onChange={(value) => setParam("sort", value)}
              label="정렬"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 py-5">
        {isError ? (
          <Message title="목록을 불러오지 못했어요" body="잠시 후 다시 시도해 주세요." />
        ) : isPending ? (
          <Skeleton />
        ) : items.length === 0 ? (
          <Message
            title="조건에 맞는 게 없어요"
            body="조건을 줄이면 더 많이 볼 수 있어요."
            action={
              <button
                type="button"
                onClick={() => router.replace("/explore", { scroll: false })}
                className="mt-5 rounded-lg bg-white/8 px-4 py-2.5 text-[14px] font-semibold text-ink"
              >
                전체 보기
              </button>
            }
          />
        ) : (
          <>
            <p className="mb-3 text-[13px] text-ink-faint">
              {hasNextPage ? `${items.length}개 넘게 있어요` : `${items.length}개`}
            </p>

            <MasonryGrid items={items} />

            <div ref={sentinel} className="h-10" />
            {isFetchingNextPage && (
              <p className="py-4 text-center text-[13px] text-ink-faint">불러오는 중</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}

/**
 * 한 묶음 안에서 하나만 고르는 단추들.
 *
 * 테두리 하나로 감싸서 어디까지가 한 질문인지 보이게 한다. 낱개로 흩어 두면 아홉 개가
 * 전부 같은 층위로 보여서, 무엇과 무엇이 서로 배타적인지 눌러봐야 알게 된다.
 */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: string;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex shrink-0 items-center gap-0.5 rounded-xl bg-surface p-1"
    >
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[13px] whitespace-nowrap transition-colors",
              selected ? "bg-white/12 font-semibold text-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function Divider() {
  return <span className="h-5 w-px shrink-0 bg-line" aria-hidden />;
}

/**
 * 불러오는 동안의 자리.
 *
 * 실제 격자와 칸 수·높이가 같아야 다 불러왔을 때 화면이 튀지 않는다. 좁은 화면에서
 * 뒤쪽 칸은 접는다 — 칸이 다섯이면 한 장이 손톱만 해진다.
 */
function Skeleton() {
  const HEIGHTS = ["h-72", "h-96", "h-64", "h-80", "h-72"];
  const VISIBLE = ["flex", "flex", "hidden sm:flex", "hidden lg:flex", "hidden xl:flex"];

  return (
    <div className="flex gap-2">
      {HEIGHTS.map((_, column) => (
        <div key={column} className={cn("min-w-0 flex-1 flex-col gap-2", VISIBLE[column])}>
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className={cn("rounded-xl bg-surface", HEIGHTS[(column + row) % HEIGHTS.length])}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function Message({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-24 text-center">
      <p className="text-[16px] font-semibold text-ink">{title}</p>
      <p className="mt-1.5 text-[14px] text-ink-soft">{body}</p>
      {action}
    </div>
  );
}
