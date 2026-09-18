"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Category } from "@/entities/template/model/types";

/**
 * 첫 화면.
 *
 * 검색창을 한가운데 크게 둔다. 이 서비스에 오는 사람은 대개 "본 게 있어서" 온다 —
 * 릴스에서 어떤 영상을 보고 그걸 찾으러 오는 것이라, 둘러보기보다 찾기가 먼저다.
 *
 * 검색창 아래에 카테고리를 칩으로 깐다. 무엇을 검색해야 할지 모르는 사람에게는
 * 빈 검색창이 벽이 되기 때문에, 바로 누를 수 있는 입구를 함께 준다.
 */
export function SearchHero({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <section className="relative overflow-hidden">
      {/* 뒤에 깔리는 옅은 색. 흰 화면이 그냥 비어 보이지 않게 한다 */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(60% 80% at 20% 0%, var(--color-accent) 0%, transparent 60%), radial-gradient(50% 70% at 85% 10%, var(--color-accent-2) 0%, transparent 60%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-4xl px-4 pb-10 pt-16 text-center sm:pt-24">
        <h1 className="text-[34px] font-bold leading-[1.15] tracking-tight text-ink sm:text-[52px]">
          릴스에서 본 그 영상,
          <br />
          <span className="text-brand">사진 한 장이면 돼요</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-ink-soft sm:text-[17px]">
          유행하는 AI 영상과 이미지의 프롬프트를 모았어요. 원문을 받아 가서 직접 만들거나,
          사진만 올리고 맡기면 돼요.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const trimmed = query.trim();
            router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/explore");
          }}
          className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full border border-line bg-ground p-2 shadow-[0_8px_30px_rgba(18,18,26,0.08)]"
        >
          <span className="pl-3 text-ink-faint" aria-hidden>
            <SearchIcon />
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="어떤 걸 만들고 싶나요?"
            aria-label="템플릿 검색"
            className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-ink outline-none placeholder:text-ink-faint"
          />
          <button
            type="submit"
            className="bg-brand shrink-0 rounded-full px-5 py-2.5 text-[14px] font-semibold text-accent-ink"
          >
            찾아보기
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/explore?contentType=VIDEO"
            className="rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface"
          >
            영상
          </Link>
          <Link
            href="/explore?contentType=IMAGE"
            className="rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface"
          >
            이미지
          </Link>
          {categories.slice(0, 5).map((category) => (
            <Link
              key={category.slug}
              href={`/explore?category=${category.slug}`}
              className="rounded-full border border-line px-4 py-2 text-[13px] font-medium text-ink hover:bg-surface"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <circle cx="9" cy="9" r="6" />
      <path d="m13.5 13.5 4 4" strokeLinecap="round" />
    </svg>
  );
}
