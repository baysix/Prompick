import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";
import { ButtonLink } from "@/shared/ui/Button";
import { SiteFooter } from "@/widgets/site-footer/SiteFooter";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";

/**
 * 글이 중심인 화면의 틀.
 *
 * 가격·도움말·약관처럼 읽으라고 있는 화면들이 쓴다. 결과물 격자와 달리 여기서는
 * 줄 길이가 중요해서 본문 폭을 좁게 잡는다. 격자를 넣어야 하면 wide로 넓힌다.
 */
export function PageShell({
  title,
  description,
  wide = false,
  children,
}: {
  title: string;
  description?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className={cn("mx-auto px-4 py-12", wide ? "max-w-[1280px]" : "max-w-3xl")}>
          <header className="mb-9">
            <h1 className="text-[30px] font-bold leading-tight tracking-[-0.04em] text-ink sm:text-[36px]">
              {title}
            </h1>
            {description && (
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft">
                {description}
              </p>
            )}
          </header>

          {children}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

/**
 * 아직 아무것도 없을 때.
 *
 * 빈 화면은 막다른 길이 아니라 다음 행동을 알려주는 자리다. 그래서 무엇이 없는지보다
 * 무엇을 하면 되는지를 더 크게 둔다.
 */
export function EmptyState({
  title,
  body,
  action,
  actionHref = "/explore",
  actionLabel = "템플릿 둘러보기",
}: {
  title: string;
  body: string;
  /** 직접 넣고 싶은 행동. 주지 않으면 둘러보기 버튼이 들어간다 */
  action?: ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-2xl border border-line px-6 py-20 text-center">
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-ink-soft">{body}</p>
      <div className="mt-6">
        {action ?? <ButtonLink href={actionHref}>{actionLabel}</ButtonLink>}
      </div>
    </div>
  );
}
