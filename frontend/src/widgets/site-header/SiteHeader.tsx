"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { SERVICE } from "@/shared/config/env";
import { cn } from "@/shared/lib/cn";
import { UserMenu } from "./UserMenu";

/**
 * 상단바.
 *
 * 영상이냐 이미지냐를 맨 앞에 둔다. 이 서비스에서 이후 행동이 완전히 갈리는 첫 갈림길이다.
 * 갤러리와 요청이 그다음인데, 둘 다 "다시 오게 만드는" 자리다 — 갤러리는 남의 결과물을 보고
 * 따라 만들게 하고, 요청은 다음에 무엇을 만들지 알려준다.
 *
 * 공지·도움말·약관은 푸터로 내렸다. 매일 누르는 것이 아니라 필요할 때 찾는 것이라,
 * 상단에 두면 정작 중요한 메뉴를 밀어낸다.
 */
const NAV = [
  { href: "/explore?contentType=VIDEO", label: "영상", contentType: "VIDEO" },
  { href: "/explore?contentType=IMAGE", label: "이미지", contentType: "IMAGE" },
  { href: "/gallery", label: "갤러리" },
  { href: "/requests", label: "요청" },
  { href: "/pricing", label: "가격" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-ground/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-5 px-4">
        <Link href="/" className="shrink-0 text-[17px] font-bold tracking-tight text-ink">
          {SERVICE.name}
        </Link>

        <Suspense fallback={<div className="flex-1" />}>
          <Nav />
        </Suspense>

        <div className="ml-auto flex items-center gap-2">
          {/*
            검색은 헤더에 둔다. 첫 화면에서는 무엇을 만들 수 있는지 보여주는 게 먼저이고,
            찾으러 온 사람은 어느 화면에서든 바로 칠 수 있어야 한다.
          */}
          <Suspense fallback={null}>
            <HeaderSearch />
          </Suspense>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

function Nav() {
  const pathname = usePathname();
  const contentType = useSearchParams().get("contentType");

  return (
    <nav className="hidden items-center gap-0.5 md:flex">
      {NAV.map((item) => {
        const active =
          "contentType" in item
            ? pathname === "/explore" && contentType === item.contentType
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-3.5 py-2 text-[14px] transition-colors",
              active
                ? "bg-surface font-semibold text-ink"
                : "text-ink-soft hover:bg-surface hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** 헤더 검색. 좁은 화면에서는 아이콘만 남는다 */
function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      }}
      className="hidden items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 sm:flex"
    >
      <span className="text-ink-faint" aria-hidden>
        <SearchIcon />
      </span>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="찾아보기"
        aria-label="템플릿 검색"
        className="w-28 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-faint lg:w-40"
      />
    </form>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="9" cy="9" r="6" />
      <path d="m13.5 13.5 4 4" strokeLinecap="round" />
    </svg>
  );
}
