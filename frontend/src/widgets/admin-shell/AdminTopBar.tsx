"use client";

import { useSession } from "@/shared/auth/SessionProvider";

/** 관리자 상단바. 지금 누구로 들어와 있는지 항상 보이게 한다. */
export function AdminTopBar({ title }: { title: string }) {
  const { me, signOut } = useSession();

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-line bg-ground/85 px-5 backdrop-blur-xl">
      <h1 className="text-[15px] font-semibold text-ink">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        {me && (
          <span className="text-[12px] text-ink-soft">
            {me.nickname}
            <span className="ml-1.5 rounded-full border border-line px-1.5 py-0.5 text-[10px] text-ink-faint">
              {me.role}
            </span>
          </span>
        )}
        <button
          type="button"
          onClick={() => void signOut()}
          className="text-[12px] text-ink-faint hover:text-ink"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
