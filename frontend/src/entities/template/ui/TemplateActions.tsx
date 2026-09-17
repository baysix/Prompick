"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/shared/auth/SessionProvider";
import type { GenerateAccess } from "../model/types";

/**
 * 상세 화면 하단의 제작 버튼.
 *
 * 비로그인도 여기까지 볼 수 있다. 실제로 만들려고 누르는 순간에만 로그인을 요구한다.
 * 돌아올 주소를 함께 넘겨, 로그인 뒤 보던 템플릿으로 그대로 돌아오게 한다.
 */
export function GenerateButton({
  slug,
  access,
  cost,
}: {
  slug: string;
  access: GenerateAccess;
  cost: number;
}) {
  const router = useRouter();
  const { signedIn, loading } = useSession();

  const label =
    access === "FREE" ? "무료로 만들기" : `🪙 ${cost.toLocaleString()}으로 만들기`;

  function click() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(`/t/${slug}/create`)}`);
      return;
    }
    router.push(`/t/${slug}/create`);
  }

  return (
    <button
      type="button"
      onClick={click}
      disabled={loading}
      className="shrink-0 rounded-sm bg-ink px-5 py-2.5 text-[14px] font-medium text-ground disabled:opacity-60"
    >
      {label}
    </button>
  );
}

/** 프롬프트 열람 버튼. 무료라도 로그인은 필요하다. */
export function ViewPromptButton({ slug, cost }: { slug: string; cost: number }) {
  const { signedIn } = useSession();

  if (!signedIn) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(`/t/${slug}`)}`}
        className="inline-block rounded-sm bg-ink px-3 py-1.5 text-[13px] font-medium text-ground"
      >
        로그인하고 프롬프트 보기
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="rounded-sm bg-paid px-3 py-1.5 text-[13px] font-medium text-white"
    >
      <span aria-hidden>🪙</span> {cost.toLocaleString()}으로 열어보기
    </button>
  );
}
