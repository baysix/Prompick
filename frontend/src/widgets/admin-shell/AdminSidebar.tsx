"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";

/**
 * 관리자 사이드바.
 *
 * 메뉴를 성격별로 묶는다. 운영자가 매일 도는 순서 — 무엇을 팔지(콘텐츠), 잘 돌고 있는지(운영),
 * 돈은 어떻게 되는지(회원·정산) — 가 그대로 순서가 된다.
 *
 * 아직 만들지 않은 화면은 감추지 않고 "준비 중"으로 남겨 둔다. 전체 그림이 보여야
 * 지금 무엇이 비어 있는지 알 수 있다.
 */
interface Item {
  href: string;
  label: string;
  ready: boolean;
}

const GROUPS: { title: string; items: Item[] }[] = [
  {
    title: "콘텐츠",
    items: [
      { href: "/admin/templates", label: "템플릿", ready: true },
      { href: "/admin/categories", label: "카테고리", ready: false },
      { href: "/admin/ai-models", label: "AI 모델", ready: true },
      { href: "/admin/requests", label: "요청 게시판", ready: false },
    ],
  },
  {
    title: "운영",
    items: [
      { href: "/admin/jobs", label: "생성 작업", ready: false },
      { href: "/admin/gallery", label: "갤러리 검수", ready: false },
      { href: "/admin/reports", label: "신고", ready: false },
      { href: "/admin/notice", label: "공지사항", ready: false },
      { href: "/admin/settings", label: "운영 설정", ready: false },
    ],
  },
  {
    title: "회원 · 정산",
    items: [
      { href: "/admin/users", label: "회원", ready: false },
      { href: "/admin/ledger", label: "프롬비 원장", ready: false },
      { href: "/admin/credit-products", label: "충전 상품", ready: false },
      { href: "/admin/payments", label: "결제 · 환불", ready: false },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-surface lg:block">
      <div className="sticky top-0 flex h-screen flex-col">
        <div className="flex h-14 items-center gap-2 border-b border-line px-5">
          <span className="text-[15px] font-semibold text-ink">프롬픽</span>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
            관리자
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <NavLink href="/admin" label="대시보드" active={pathname === "/admin"} ready />

          {GROUPS.map((group) => (
            <div key={group.title} className="mt-5">
              <p className="px-3 pb-1.5 text-[11px] font-medium text-ink-faint">{group.title}</p>
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  ready={item.ready}
                  active={pathname.startsWith(item.href)}
                />
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-line px-5 py-3">
          <Link href="/" className="text-[12px] text-ink-soft hover:text-ink">
            서비스 화면 보기
          </Link>
        </div>
      </div>
    </aside>
  );
}

function NavLink({
  href,
  label,
  active,
  ready,
}: {
  href: string;
  label: string;
  active: boolean;
  ready: boolean;
}) {
  if (!ready) {
    return (
      <span
        className="flex cursor-default items-center justify-between rounded-md px-3 py-2 text-[13px] text-ink-faint"
        title="아직 만들지 않았어요"
      >
        {label}
        <span className="text-[10px]">준비 중</span>
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center rounded-md px-3 py-2 text-[13px] transition-colors",
        active ? "bg-accent-soft font-semibold text-accent" : "text-ink-soft hover:bg-surface-2 hover:text-ink",
      )}
    >
      {label}
    </Link>
  );
}
