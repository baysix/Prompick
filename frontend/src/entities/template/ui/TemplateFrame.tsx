"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { isPlayableVideo } from "../lib/media";
import type { TemplateCard } from "../model/types";
import { GenerateBadge, PromptBadge } from "./AccessBadge";

/**
 * 목록의 기본 단위.
 *
 * 카드가 아니라 프레임이다. 테두리·그림자·그라데이션을 두르지 않고 결과물 자체를 타일로 쓴다.
 * 정보는 프레임 밖 아래에 왼쪽 정렬로 붙는다. 쇼츠·릴스의 시각 문법이다.
 *
 * 영상은 화면에 들어왔을 때만 음소거 자동재생한다. 보이지 않는 영상까지 재생하면
 * 목록을 조금만 스크롤해도 데이터가 크게 낭비된다.
 */
export function TemplateFrame({
  template,
  className,
  priority = false,
}: {
  template: TemplateCard;
  className?: string;
  priority?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const isVideo = isPlayableVideo(template.previewUrl);

  // 카탈로그에는 9:16, 1:1, 16:9가 섞여 있다. 프레임 높이를 9:16으로 통일해야 줄이 흐트러지지 않는다.
  // 다만 가로형을 세로로 잘라내면 원본이 무엇인지 알 수 없게 되므로, 그때만 전체를 담아 보여준다.
  const fit = template.ratio === "16:9" ? "object-contain" : "object-cover";

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          void el.play().catch(() => {
            // 브라우저가 자동재생을 막으면 포스터 이미지가 그대로 보인다. 문제될 것 없다.
          });
        } else {
          el.pause();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Link
      href={`/t/${template.slug}`}
      className={cn("group block", className)}
      aria-label={template.title}
    >
      <div className="relative aspect-[9/16] overflow-hidden bg-ink/5">
        {isVideo ? (
          <video
            ref={videoRef}
            src={template.previewUrl ?? undefined}
            poster={template.thumbnailUrl ?? undefined}
            muted
            loop
            playsInline
            preload={priority ? "auto" : "none"}
            className={cn("h-full w-full", fit)}
          />
        ) : template.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={template.thumbnailUrl}
            alt=""
            loading={priority ? "eager" : "lazy"}
            className={cn("h-full w-full", fit)}
          />
        ) : (
          <EmptyFrame />
        )}

        {/* 세로가 아닌 결과물은 비율을 알려준다. 잘려 보이는 게 아니라는 신호다 */}
        {template.ratio !== "9:16" && (
          <span className="absolute right-2 top-2 rounded-sm bg-ink/60 px-1 py-0.5 text-[10px] text-ground">
            {template.ratio}
          </span>
        )}

        {/* 재생 중이 아닌 영상에만 표시해, 지금 멈춰 있다는 걸 알린다 */}
        {isVideo && !visible && (
          <span className="absolute bottom-2 left-2 rounded-full bg-ink/70 px-1.5 py-0.5 text-[10px] text-ground">
            영상
          </span>
        )}
      </div>

      <div className="mt-2 space-y-1">
        <p className="text-[13px] font-medium leading-snug text-ink group-hover:underline">
          {template.title}
        </p>
        {template.requiredPhotoSummary && (
          <p className="text-[11px] text-ink-faint">{template.requiredPhotoSummary}</p>
        )}
        <div className="flex flex-wrap items-center gap-1 pt-0.5">
          <GenerateBadge access={template.generateAccess} cost={template.generateCost} />
          <PromptBadge access={template.promptAccess} cost={template.promptCost} />
        </div>
      </div>
    </Link>
  );
}

function EmptyFrame() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-ground-raised">
      <span className="text-[11px] text-ink-faint">예시 준비 중</span>
    </div>
  );
}
