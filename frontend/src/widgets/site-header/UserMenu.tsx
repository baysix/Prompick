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
        className="rounded-sm bg-ink px-3 py-1.5 text-[13px] font-medium text-ground"
      >
        로그인
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/my" className="text-[13px] text-ink-soft hover:text-ink">
        <span aria-hidden>🪙</span> {me?.creditBalance?.toLocaleString() ?? 0}
      </Link>
      <span className="text-[13px] text-ink">{me?.nickname}</span>
      <button
        type="button"
        onClick={() => void signOut()}
        className="text-[13px] text-ink-faint hover:text-ink"
      >
        로그아웃
      </button>
    </div>
  );
}
