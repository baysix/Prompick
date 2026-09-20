"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/cn";

/**
 * 관리자 왼쪽 메뉴.
 *
 * 위 셋은 돈에 관한 것이고(얼마 벌고 얼마 썼나, 누가 무엇을 만들었나, 누구에게 얼마가 있나),
 * 아래 셋은 무엇을 파는지에 관한 것이다(템플릿, 모델, 키). 돈 쪽을 위에 둔 이유는 매일 봐야 하는
 * 것이 그쪽이기 때문이다. 템플릿은 만들 때만 들어간다.
 */
const NAV = [
  { href: "/admin", label: "대시보드", exact: true },
  { href: "/admin/operations", label: "매출·원가" },
  { href: "/admin/jobs", label: "제작 내역" },
  { href: "/admin/users", label: "사용자" },
  { href: "/admin/requests", label: "요청" },
  { href: "/admin/templates", label: "템플릿" },
  { href: "/admin/ai-models", label: "AI 모델" },
  { href: "/admin/keys", label: "제공사 키" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-dvh w-52 shrink-0 flex-col border-r border-line bg-surface">
      <div className="px-5 py-5">
        <Link href="/admin" className="text-[16px] font-bold tracking-[-0.04em] text-ink">
          프롬픽 <span className="text-ink-faint">운영</span>
        </Link>
      </div>

      <nav className="flex-1 px-3">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "mb-0.5 block rounded-lg px-3 py-2 text-[14px] transition-colors",
                active ? "bg-white/8 font-semibold text-ink" : "text-ink-soft hover:text-ink",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line px-3 py-3">
        <Link
          href="/"
          className="block rounded-lg px-3 py-2 text-[13px] text-ink-soft transition-colors hover:text-ink"
        >
          서비스 화면으로
        </Link>
      </div>
    </aside>
  );
}
