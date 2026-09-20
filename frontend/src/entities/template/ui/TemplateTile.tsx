"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { cn } from "@/shared/lib/cn";
import { isPlayableVideo } from "../lib/media";
import type { TemplateCard } from "../model/types";

/**
 * 결과물 타일.
 *
 * 모든 격자가 이것 하나를 쓴다. 화면마다 다른 카드를 만들면 같은 결과물이 자리마다
 * 다르게 보이고, 사용자는 매번 다시 읽어야 한다.
 *
 * 평소에는 결과물만 보이고, 제목과 요금은 올렸을 때 나타난다. 결과물을 고르는 일에서
 * 먼저 필요한 것은 그림이지 글자가 아니다. 다만 손으로 쓰는 화면에는 hover가 없으므로,
 * 요금 배지는 처음부터 작게 얹어 둔다.
 *
 * 타일 높이는 올린 그림이 정한다. 우리가 틀을 정해놓고 거기에 맞춰 자르면, 운영자가 잡은
 * 구도가 망가진다. 예시 결과물은 사용자가 템플릿을 고르는 거의 유일한 근거라서, 그 그림을
 * 우리 마음대로 바꾸면 안 된다.
 */
export function TemplateTile({
  template,
  shape,
  priority = false,
  className,
}: {
  template: TemplateCard;
  /** 높이를 직접 정하고 싶을 때. 주지 않으면 올린 그림의 비율을 따른다 */
  shape?: string;
  priority?: boolean;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playable = isPlayableVideo(template.previewUrl);

  // 화면에 들어온 것만 재생한다. 전부 재생하면 데이터가 크게 낭비된다.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const free = template.generateAccess === "FREE";
  const ratio = aspectRatioOf(template);

  return (
    <Link
      href={`/t/${template.slug}`}
      className={cn(
        "group relative block overflow-hidden rounded-xl bg-surface",
        shape,
        className,
      )}
      // 그림이 로드되기 전에도 자리를 잡아둔다. 뒤늦게 높이가 정해지면 목록 전체가 출렁인다.
      style={shape ? undefined : { aspectRatio: ratio }}
      aria-label={template.title}
    >
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
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
      ) : (
        <span className="flex h-full items-center justify-center text-[11px] text-ink-faint">
          예시 준비 중
        </span>
      )}

      {/* 요금은 항상 보인다. 고르는 순간 가장 먼저 필요한 정보다 */}
      <span
        className={cn(
          "absolute left-2 top-2 rounded-md px-1.5 py-0.5 text-[11px] font-semibold backdrop-blur",
          free ? "bg-accent/90 text-accent-ink" : "bg-black/60 text-paid",
        )}
      >
        {free ? "무료" : `🪙 ${template.generateCost}`}
      </span>

      {/* 제목은 올렸을 때만. 결과물을 가리지 않는다 */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <p className="truncate text-[13px] font-semibold text-white">{template.title}</p>
        {template.promptAccess !== "HIDDEN" && (
          <p className="mt-0.5 text-[11px] text-white/70">프롬프트 공개</p>
        )}
      </div>
    </Link>
  );
}


/**
 * 타일이 차지할 비율.
 *
 * 올린 그림의 실제 크기를 가장 먼저 쓴다. 그것을 모르면 템플릿이 만들어내는 결과물의 비율로
 * 대신한다 — 어차피 예시는 그 비율로 나온 그림일 테니 크게 어긋나지 않는다. 둘 다 없으면
 * 세로로 긴 3:4로 둔다.
 */
function aspectRatioOf(template: TemplateCard): string {
  if (template.mediaRatio) {
    return template.mediaRatio;
  }
  // "9:16" 같은 표기를 CSS가 읽는 형태로 바꾼다
  const parts = template.ratio?.split(":");
  if (parts?.length === 2 && Number(parts[0]) > 0 && Number(parts[1]) > 0) {
    return `${parts[0]} / ${parts[1]}`;
  }
  return "3 / 4";
}
