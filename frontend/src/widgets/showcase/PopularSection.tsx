"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { isPlayableVideo } from "@/entities/template/lib/media";
import type { TemplateCard } from "@/entities/template/model/types";
import { cn } from "@/shared/lib/cn";

/**
 * 인기 목록.
 *
 * 제목을 가운데 크게 두고, 그 아래 알약 탭으로 추려 보게 한다. 카드는 가로로 흐르며
 * 화면 오른쪽에서 잘린다 — 더 있다는 걸 화살표나 안내 문구 없이 알린다.
 *
 * 탭은 주소를 바꾸지 않고 이 자리에서 걸러낸다. 홈에서 잠깐 훑어보는 동작이라,
 * 페이지를 옮기면 흐름이 끊긴다. 본격적으로 고르려는 사람은 아래 버튼으로 탐색에 간다.
 */
interface Tab {
  label: string;
  match: (t: TemplateCard) => boolean;
}

const TABS: Tab[] = [
  { label: "전체", match: () => true },
  { label: "무료로 제작", match: (t) => t.generateAccess === "FREE" },
  { label: "프롬프트 공개", match: (t) => t.promptAccess !== "HIDDEN" },
  { label: "세로", match: (t) => t.ratio === "9:16" },
];

export function PopularSection({
  title,
  items,
  moreHref,
  moreLabel,
}: {
  title: string;
  items: TemplateCard[];
  moreHref: string;
  moreLabel: string;
}) {
  const [tab, setTab] = useState(0);
  if (items.length === 0) return null;

  const filtered = items.filter(TABS[tab].match);

  return (
    <section className="py-14 sm:py-20">
      <h2 className="px-4 text-center text-[26px] font-bold tracking-tight text-ink sm:text-[36px]">
        {title}
      </h2>

      <div className="mt-6 flex justify-center px-4">
        <div className="scroll-row flex max-w-full gap-1 overflow-x-auto rounded-full border border-line bg-ground p-1.5 shadow-[0_4px_20px_rgba(18,18,26,0.06)]">
          {TABS.map((t, i) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setTab(i)}
              aria-pressed={i === tab}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-[14px] font-medium transition-colors",
                i === tab ? "bg-brand text-accent-ink" : "text-ink-soft hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-14 text-center text-[14px] text-ink-faint">
          여기에 해당하는 게 아직 없어요
        </p>
      ) : (
        <div className="scroll-row mt-8 overflow-x-auto">
          {/* 오른쪽으로 흘러 잘리게 둔다. 더 있다는 신호가 된다 */}
          <div className="flex w-max gap-3 px-4 sm:px-8">
            {filtered.map((template, i) => (
              <PopularCard key={template.slug} template={template} priority={i < 5} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-center px-4">
        <Link
          href={moreHref}
          className="rounded-full border border-line px-5 py-2.5 text-[14px] font-semibold text-ink hover:bg-surface"
        >
          {moreLabel}
        </Link>
      </div>
    </section>
  );
}

function PopularCard({ template, priority }: { template: TemplateCard; priority: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playable = isPlayableVideo(template.previewUrl);

  // 화면에 들어온 영상만 재생한다. 목록 전체를 재생하면 데이터가 크게 낭비된다.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Link href={`/t/${template.slug}`} className="group w-[168px] shrink-0 sm:w-[196px]">
      <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-surface-2">
        {playable ? (
          <video
            ref={videoRef}
            src={template.previewUrl ?? undefined}
            poster={template.thumbnailUrl ?? undefined}
            muted
            loop
            playsInline
            preload={priority ? "auto" : "none"}
            className="h-full w-full object-cover"
          />
        ) : template.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.thumbnailUrl}
            alt=""
            loading={priority ? "eager" : "lazy"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : null}

        {/* 요금은 카드 위에 작게. 고르는 순간 바로 보여야 하는 정보다 */}
        <span
          className={cn(
            "absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold backdrop-blur",
            template.generateAccess === "FREE"
              ? "bg-free-soft/90 text-free"
              : "bg-paid-soft/90 text-paid",
          )}
        >
          {template.generateAccess === "FREE" ? "무료" : `🪙 ${template.generateCost}`}
        </span>

        {template.promptAccess !== "HIDDEN" && (
          <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
            프롬프트
          </span>
        )}
      </div>

      <p className="mt-2 truncate text-[13px] font-medium text-ink group-hover:underline">
        {template.title}
      </p>
      {template.requiredPhotoSummary && (
        <p className="truncate text-[11px] text-ink-faint">{template.requiredPhotoSummary}</p>
      )}
    </Link>
  );
}
