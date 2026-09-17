"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { isPlayableVideo } from "@/entities/template/lib/media";
import type { TemplateCard } from "@/entities/template/model/types";
import { cn } from "@/shared/lib/cn";

/**
 * 메인 상단의 결과물 격자.
 *
 * 이 서비스가 파는 것은 결과물이므로, 첫 화면을 설명 문구가 아니라 결과물로 채운다.
 * 세로 영상을 벽돌처럼 쌓아 한 번에 여러 개가 움직이게 하고, 그 위에 카피와 행동을 얹는다.
 *
 * 높이가 제각각인 타일을 CSS columns로 쌓는다. grid와 달리 빈 칸이 생기지 않아
 * 영상이 화면을 빈틈없이 채운다.
 */
export function ShowcaseGrid({ items }: { items: TemplateCard[] }) {
  // 격자가 성기게 보이지 않도록 최소 개수를 채운다. 적으면 반복해서 쓴다.
  const tiles = fill(items, 30);

  // 열마다 번갈아 아래로 밀어 벽돌처럼 어긋나게 쌓는다.
  const columns = distribute(tiles, 6);

  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="flex h-[78vh] min-h-[480px] gap-2.5 px-2.5" aria-hidden>
        {columns.map((column, ci) => (
          <div
            key={ci}
            className={cn(
              "flex min-w-0 flex-1 flex-col gap-2.5",
              ci % 2 === 1 ? "-mt-10" : "-mt-2",
              // 좁은 화면에서는 열을 줄인다. 타일이 손톱만 해지면 아무것도 안 보인다.
              ci >= 3 && "hidden sm:flex",
              ci >= 4 && "hidden lg:flex",
            )}
          >
            {column.map((tile, ti) => (
              <Tile key={`${tile.slug}-${ci}-${ti}`} template={tile} index={ci * 3 + ti} />
            ))}
          </div>
        ))}
      </div>

      {/*
        덮개는 바닥에만 얇게 깐다. 너무 넓게 덮으면 격자가 유령처럼 흐려져서,
        결과물을 보여주려고 만든 화면이 제 일을 못 한다. 글자 읽힘은 아래 흰 판이 맡는다.
      */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ground to-transparent" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-7xl px-4 pb-10 sm:pb-12">
          <div className="pointer-events-auto max-w-xl rounded-3xl bg-ground/92 p-6 backdrop-blur-md sm:p-8">
          <h1 className="max-w-2xl text-[30px] font-bold leading-[1.2] tracking-tight text-ink sm:text-[40px]">
            릴스에서 본 그 영상,
            <br />
            사진 한 장이면 돼요.
          </h1>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-ink-soft">
            유행하는 AI 영상과 이미지의 프롬프트를 모았어요. 원문을 그대로 받아 가서 직접
            만들거나, 사진만 올리고 맡기면 돼요.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/explore"
              className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-semibold text-accent-ink shadow-sm shadow-accent/25"
            >
              뭐가 있는지 둘러보기
            </Link>
            <Link
              href="/explore?promptOnly=true"
              className="rounded-full border border-line bg-ground px-5 py-2.5 text-[14px] font-medium text-ink"
            >
              프롬프트만 보기
            </Link>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 타일을 열 개수만큼 나눠 담는다 */
function distribute(items: TemplateCard[], columnCount: number): TemplateCard[][] {
  const columns: TemplateCard[][] = Array.from({ length: columnCount }, () => []);
  items.forEach((item, i) => columns[i % columnCount].push(item));
  return columns;
}

function Tile({ template, index }: { template: TemplateCard; index: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playable = isPlayableVideo(template.previewUrl);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) void el.play().catch(() => {});
        else el.pause();
      },
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // 타일 높이를 조금씩 다르게 해서 벽돌처럼 어긋나게 쌓는다.
  const shape = ["aspect-[9/16]", "aspect-[3/4]", "aspect-[9/16]", "aspect-[4/5]"][index % 4];

  return (
    <div className={cn("shrink-0 overflow-hidden rounded-xl bg-surface", shape)}>
      {playable ? (
        <video
          ref={videoRef}
          src={template.previewUrl ?? undefined}
          poster={template.thumbnailUrl ?? undefined}
          muted
          loop
          playsInline
          preload={index < 6 ? "auto" : "none"}
          className="h-full w-full object-cover"
        />
      ) : template.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={template.thumbnailUrl}
          alt=""
          loading={index < 6 ? "eager" : "lazy"}
          className="h-full w-full object-cover"
        />
      ) : null}
    </div>
  );
}

/** 타일이 모자라면 앞에서부터 다시 가져와 격자를 채운다 */
function fill(items: TemplateCard[], count: number): TemplateCard[] {
  if (items.length === 0) return [];
  const out: TemplateCard[] = [];
  for (let i = 0; i < count; i++) out.push(items[i % items.length]);
  return out;
}
