"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/shared/auth/SessionProvider";

/** 헤더 오른쪽. 로그인 상태에 따라 잔액이나 로그인 버튼을 보여준다. */
export function UserMenu() {
  const { loading, signedIn, me, signOut } = useSession();
  const pathname = usePathname();

  if (loading) {
    // 로그인 여부를 확인하는 사이 버튼이 깜빡이지 않도록 자리만 잡아 둔다.
    return <span className="h-7 w-16" />;
  }

  if (!signedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className="bg-brand rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-accent-ink"
      >
        로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href="/my/credits"
        className="flex items-center gap-1 rounded-full bg-surface px-3 py-2 text-[13px] font-medium text-ink"
      >
        <span aria-hidden>🪙</span>
        {me?.creditBalance?.toLocaleString() ?? 0}
      </Link>
      <Link
        href="/my/jobs"
        className="hidden rounded-full px-3 py-2 text-[13px] text-ink-soft hover:bg-surface hover:text-ink sm:block"
      >
        {me?.nickname ?? "내 정보"}
      </Link>
      <button
        type="button"
        onClick={() => void signOut()}
        className="rounded-full px-3 py-2 text-[13px] text-ink-faint hover:bg-surface hover:text-ink"
      >
        로그아웃
      </button>
    </div>
  );
}
