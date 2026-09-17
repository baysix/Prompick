import type { ReactNode } from "react";
import { SiteFooter } from "@/widgets/site-footer/SiteFooter";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";

/** 머리말이 있는 일반 페이지 틀. 모든 정보성 화면이 같은 리듬을 갖게 한다. */
export function PageShell({
  title,
  description,
  children,
  wide = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="border-b border-line bg-surface">
          <div className={container(wide, "py-10 sm:py-12")}>
            <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[32px]">{title}</h1>
            {description && (
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
                {description}
              </p>
            )}
          </div>
        </div>
        <div className={container(wide, "py-8 sm:py-10")}>{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}

function container(wide: boolean, padding: string) {
  return `mx-auto ${wide ? "max-w-7xl" : "max-w-4xl"} px-4 ${padding}`;
}

/** 아직 데이터가 없을 때. 빈 화면은 다음 행동을 알려주는 자리다. */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-6 py-16 text-center">
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-soft">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
