"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "@/shared/auth/SessionProvider";
import { cn } from "@/shared/lib/cn";

/**
 * 마이페이지 틀.
 *
 * 로그인한 사람이 "내가 뭘 했고 뭘 가졌는지" 확인하는 곳이다. 작업함이 먼저이고,
 * 산 프롬프트가 그다음이다 — 돈을 내고 받은 것을 다시 찾을 수 없으면 신뢰가 무너진다.
 */
const TABS = [
  { href: "/my/jobs", label: "내 작업함" },
  { href: "/my/prompts", label: "내 프롬프트" },
  { href: "/my/favorites", label: "찜" },
  { href: "/my/credits", label: "프롬비" },
  { href: "/my/settings", label: "설정" },
] as const;

export function MyShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { loading, signedIn, me } = useSession();

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-24 text-[13px] text-ink-faint">확인 중</div>;
  }

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24 text-center">
        <p className="text-[15px] font-semibold text-ink">로그인이 필요해요</p>
        <Link
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="bg-brand mt-4 inline-block rounded-full px-4 py-2 text-[14px] font-semibold text-accent-ink"
        >
          로그인
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="text-[22px] font-bold tracking-tight text-ink">{me?.nickname}</h1>
        <span className="rounded-full bg-surface px-3 py-1 text-[13px] font-medium text-ink">
          <span aria-hidden>🪙</span> {me?.creditBalance?.toLocaleString() ?? 0}
        </span>
        {!me?.identityVerified && (
          <span className="text-[12px] text-ink-faint">
            무료 제작에는 휴대폰 인증이 필요해요
          </span>
        )}
      </div>

      <nav className="scroll-row mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "-mb-px shrink-0 border-b-2 px-3.5 py-2.5 text-[14px] transition-colors",
                active
                  ? "border-ink font-semibold text-ink"
                  : "border-transparent text-ink-soft hover:text-ink",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div className="py-7">{children}</div>
    </div>
  );
}
