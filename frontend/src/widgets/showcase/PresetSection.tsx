import Link from "next/link";
import { ButtonLink, ArrowIcon } from "@/shared/ui/Button";
import { MasonryGrid } from "./MasonryGrid";
import type { TemplateCard } from "@/entities/template/model/types";

/**
 * 결과물 묶음 하나.
 *
 * 제목과 설명은 왼쪽, 시작 버튼은 오른쪽. 그 아래로 결과물이 깔린다.
 *
 * 결과물은 메이슨리로 쌓는다. 세로 영상과 정사각 이미지가 섞여 있어서 높이를 하나로
 * 맞추면 어느 한쪽이 잘리거나 여백이 생긴다. 높이를 그대로 두고 빈칸 없이 채우는 쪽이
 * 결과물을 있는 그대로 보여준다.
 *
 * 쌓는 방법은 MasonryGrid가 안다.
 */
export function PresetSection({
  title,
  description,
  items,
  href,
  ctaLabel = "무료로 시작하기",
  badge,
  primary = false,
}: {
  title: string;
  description?: string;
  items: TemplateCard[];
  href: string;
  ctaLabel?: string;
  badge?: string;
  /** 화면의 첫 묶음. 제목이 이 문서의 h1이 된다 */
  primary?: boolean;
}) {
  if (items.length === 0) return null;

  const Heading = primary ? "h1" : "h2";

  return (
    <section className="overflow-hidden rounded-2xl border border-line">
      <header className="flex flex-col gap-4 px-4 py-5 sm:flex-row sm:items-end sm:px-5">
        <div className="min-w-0 flex-1">
          {badge && (
            <span className="mb-2 inline-block rounded-md bg-accent/12 px-2 py-0.5 text-[11px] font-semibold text-accent">
              {badge}
            </span>
          )}
          <Heading
            className={
              primary
                ? "text-[24px] font-bold leading-tight tracking-[-0.045em] text-ink sm:text-[32px]"
                : "text-[20px] font-bold leading-tight tracking-[-0.04em] text-ink sm:text-[24px]"
            }
          >
            {title}
          </Heading>
          {description && (
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{description}</p>
          )}
        </div>

        <ButtonLink href={href} size="md" className="shrink-0 self-start sm:self-auto">
          {ctaLabel}
          <ArrowIcon />
        </ButtonLink>
      </header>

      <Masonry items={items} href={href} />
    </section>
  );
}

function Masonry({ items, href }: { items: TemplateCard[]; href: string }) {
  const shown = items.slice(0, 15);

  return (
    <div className="px-4 pb-5 sm:px-5">
      <MasonryGrid items={shown} />

      {items.length > shown.length && (
        <Link
          href={href}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-line py-4 text-[13px] text-ink-soft transition-colors hover:text-ink"
        >
          결과물 {items.length - shown.length}개 더 보기
          <ArrowIcon />
        </Link>
      )}
    </div>
  );
}
