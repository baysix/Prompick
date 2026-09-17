"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "@/shared/auth/SessionProvider";

/**
 * 관리자 화면 접근 제한.
 *
 * 진짜 방어선은 백엔드다. 여기서 막는 것은 권한 없는 사람에게 빈 화면과 실패한 요청을
 * 보여주지 않기 위한 안내에 가깝다.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const { loading, signedIn, me } = useSession();
  const pathname = usePathname();

  if (loading) {
    return <Message title="확인 중" />;
  }

  if (!signedIn) {
    return (
      <Message title="관리자 로그인이 필요해요">
        <Link
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="inline-block rounded-sm bg-accent px-3 py-1.5 text-[13px] font-medium text-accent-ink"
        >
          로그인
        </Link>
      </Message>
    );
  }

  if (me && me.role !== "ADMIN") {
    return (
      <Message title="관리자만 볼 수 있어요">
        <p className="text-[13px] text-ink-soft">
          {me.nickname} 님의 계정에는 관리자 권한이 없어요.
        </p>
      </Message>
    );
  }

  return <>{children}</>;
}

function Message({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <main className="mx-auto max-w-md flex-1 px-4 py-24 text-center">
      <p className="text-[15px] font-medium text-ink">{title}</p>
      <div className="mt-3">{children}</div>
    </main>
  );
}
