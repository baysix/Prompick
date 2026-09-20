"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import { useSession } from "@/shared/auth/SessionProvider";

/**
 * 서비스 화면에서 바로 편집으로 가는 길.
 *
 * 운영자는 템플릿을 고치고 나면 사용자 화면에서 확인한다. 거기서 고칠 곳을 또 발견하는데,
 * 그때마다 관리자 화면으로 돌아가 목록에서 다시 찾아야 했다. 보고 있는 그 템플릿으로 바로
 * 갈 수 있으면 그 왕복이 사라진다.
 *
 * 운영자에게만 보인다. 사용자 화면은 템플릿의 id를 모르고 주소만 알기 때문에, 주소로 id를
 * 찾아오는 요청을 한 번 보낸다 — 운영자일 때만.
 */
export function EditTemplateLink({ slug }: { slug: string }) {
  const { me } = useSession();
  const isAdmin = me?.role === "ADMIN";

  const { data } = useQuery({
    queryKey: adminKeys.templateBySlug(slug),
    queryFn: () => adminApi.templateBySlug(slug),
    enabled: isAdmin,
    // 편집하러 갔다 돌아와도 다시 묻지 않는다. id는 바뀌지 않는다.
    staleTime: Infinity,
  });

  if (!isAdmin || !data) {
    return null;
  }

  return (
    <Link
      href={`/admin/templates/${data.id}`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-[12px] font-medium text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
    >
      <PencilIcon />이 템플릿 수정
    </Link>
  );
}

function PencilIcon() {
  return (
    <svg
      viewBox="0 0 14 14"
      className="h-3 w-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M9.5 2.5 11.5 4.5 5 11H3V9z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
