"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
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

        <div className="ml-auto flex items-center gap-1.5">
          <Link
            href="/search"
            aria-label="검색"
            className="rounded-full p-2 text-ink-soft hover:bg-surface hover:text-ink"
          >
            <SearchIcon />
          </Link>
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
      <circle cx="9" cy="9" r="6" />
      <path d="m13.5 13.5 4 4" strokeLinecap="round" />
    </svg>
  );
}
