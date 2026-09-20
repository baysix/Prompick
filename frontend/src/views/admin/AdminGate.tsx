"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "@/shared/auth/SessionProvider";
import { ButtonLink } from "@/shared/ui/Button";

/**
 * 관리자 확인.
 *
 * 이건 화면을 가릴 뿐이고, 진짜 방어는 서버가 한다. 토큰 없이 부른 요청은 401,
 * 관리자가 아닌 토큰은 403으로 막힌다. 여기서 막는 이유는 권한 없는 사람에게
 * 빈 화면과 붉은 오류만 보여주지 않기 위해서다.
 */
export function AdminGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { loading, signedIn, me } = useSession();

  if (loading) return <Notice title="확인 중" />;

  if (!signedIn) {
    return (
      <Notice title="로그인이 필요해요" body="관리자 계정으로 로그인해 주세요.">
        <ButtonLink href={`/login?next=${encodeURIComponent(pathname)}`}>로그인</ButtonLink>
      </Notice>
    );
  }

  if (me?.role !== "ADMIN") {
    return (
      <Notice
        title="권한이 없어요"
        body="이 화면은 운영자만 볼 수 있어요. 계정이 맞는지 확인해 주세요."
      >
        <ButtonLink href="/" variant="secondary">
          서비스 화면으로
        </ButtonLink>
      </Notice>
    );
  }

  return <>{children}</>;
}

function Notice({
  title,
  body,
  children,
}: {
  title: string;
  body?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5">
      <div className="max-w-sm text-center">
        <p className="text-[16px] font-semibold text-ink">{title}</p>
        {body && <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">{body}</p>}
        {children && <div className="mt-5">{children}</div>}
      </div>
    </div>
  );
}
