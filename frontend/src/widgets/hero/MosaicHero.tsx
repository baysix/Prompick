"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { isPlayableVideo } from "@/entities/template/lib/media";
import type { TemplateCard } from "@/entities/template/model/types";
import { cn } from "@/shared/lib/cn";

/**
 * 첫 화면.
 *
 * 결과물을 화면 끝에서 끝까지 빈틈없이 깐다. 이 서비스가 파는 것이 결과물이므로,
 * 설명보다 결과물을 한 번에 많이 보여주는 편이 빠르다.
 *
 * 밀도가 이 화면의 전부다. 타일 사이를 벌리거나 가운데로 모으면 "목록"이 되어버리고,
 * 목록은 훑게 만들지 못한다. 그래서 여백을 2px로 두고 화면 밖으로 흘려보낸다.
 *
 * 높이를 제각각으로 쌓는 이유도 같다. 줄이 딱 맞으면 눈이 한 번에 전체를 읽고 끝나는데,
 * 어긋나 있으면 시선이 계속 움직인다.
 */
export function MosaicHero({ items }: { items: TemplateCard[] }) {
  // 격자를 채우려면 수가 필요하다. 모자라면 앞에서부터 다시 가져온다.
  const tiles = fill(items, 36);
  const columns = distribute(tiles, 7);

  return (
    <section className="relative isolate overflow-hidden bg-[#0b0b0f]">
      <div className="flex h-[78vh] min-h-[520px] gap-[3px]" aria-hidden>
        {columns.map((column, ci) => (
          <div
            key={ci}
            className={cn(
              "flex min-w-0 flex-1 flex-col gap-[3px]",
              // 열마다 시작 높이를 어긋나게 해 격자가 줄로 보이지 않게 한다
              ci % 3 === 0 && "-mt-16",
              ci % 3 === 1 && "-mt-4",
              ci % 3 === 2 && "-mt-24",
              // 좁은 화면에서는 열을 줄인다. 타일이 손톱만 해지면 아무것도 안 보인다
              ci >= 3 && "hidden sm:flex",
              ci >= 5 && "hidden lg:flex",
            )}
          >
            {column.map((tile, ti) => (
              <Tile key={`${tile.slug}-${ci}-${ti}`} template={tile} index={ci * 5 + ti} />
            ))}
          </div>
        ))}
      </div>

      {/* 위아래를 어둡게 덮어 헤더와 다음 섹션으로 자연스럽게 넘어가게 한다 */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#0b0b0f] to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0b0b0f] to-transparent" />

      {/* 한가운데 놓는다. 격자 위에 얹혀 결과물과 행동이 한 화면에 함께 있다 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="max-w-3xl text-[32px] font-bold leading-[1.15] tracking-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)] sm:text-[54px]">
          릴스에서 본 그 영상,
          <br />
          사진 한 장이면 돼요
        </h1>

        <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/80 drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] sm:text-[17px]">
          프롬프트를 받아 가서 직접 만들거나, 사진만 올리고 맡기면 돼요
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <Link
            href="/explore"
            className="rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-[#0b0b0f]"
          >
            무료로 시작하기
          </Link>
          <Link
            href="/explore?promptOnly=true"
            className="rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-[15px] font-semibold text-white backdrop-blur"
          >
            프롬프트만 보기
          </Link>
        </div>
      </div>
    </section>
  );
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

  // 높이를 네 가지로 섞는다. 한 가지면 격자가 바둑판처럼 보인다
  const shape = ["aspect-[9/16]", "aspect-[3/4]", "aspect-[1/1]", "aspect-[9/16]"][index % 4];

  return (
    <div className={cn("shrink-0 overflow-hidden rounded-[10px] bg-white/5", shape)}>
      {playable ? (
        <video
          ref={videoRef}
          src={template.previewUrl ?? undefined}
          poster={template.thumbnailUrl ?? undefined}
          muted
          loop
          playsInline
          preload={index < 8 ? "auto" : "none"}
          className="h-full w-full object-cover"
        />
      ) : template.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={template.thumbnailUrl}
          alt=""
          loading={index < 8 ? "eager" : "lazy"}
          className="h-full w-full object-cover"
        />
      ) : null}
    </div>
  );
}

/** 타일이 모자라면 앞에서부터 다시 가져와 격자를 채운다 */
function fill(items: TemplateCard[], count: number): TemplateCard[] {
  if (items.length === 0) return [];
  return Array.from({ length: count }, (_, i) => items[i % items.length]);
}

/** 타일을 열 개수만큼 나눠 담는다 */
function distribute(items: TemplateCard[], columnCount: number): TemplateCard[][] {
  const columns: TemplateCard[][] = Array.from({ length: columnCount }, () => []);
  items.forEach((item, i) => columns[i % columnCount].push(item));
  return columns;
}
