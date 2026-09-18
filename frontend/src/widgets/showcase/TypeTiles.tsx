import Link from "next/link";
import type { TemplateCard } from "@/entities/template/model/types";

/**
 * 무엇을 만들지 고르는 자리.
 *
 * 이 서비스가 만드는 것은 영상과 이미지 둘뿐이다. 그 아래 주제까지 나누면 고를 층이
 * 두 개가 되어 결정이 늦어진다. 두 갈래면 충분하다.
 *
 * 칸 안에는 그 종류의 실제 결과물을 깔았다. 글자만 있으면 무엇이 나오는지 상상해야 한다.
 */
export function TypeTiles({
  video,
  image,
}: {
  video: TemplateCard[];
  image: TemplateCard[];
}) {
  if (video.length === 0 && image.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <h2 className="text-[22px] font-bold tracking-tight text-ink sm:text-[26px]">
        무엇을 만들까요
      </h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Tile
          href="/explore?contentType=VIDEO"
          title="영상"
          body="움직이는 결과물. 릴스·쇼츠에 그대로 올릴 수 있어요"
          samples={video}
          tone="from-[#7a2ff2] to-[#b06ffb]"
        />
        <Tile
          href="/explore?contentType=IMAGE"
          title="이미지"
          body="한 장짜리 결과물. 상세페이지나 프로필에 써요"
          samples={image}
          tone="from-[#00c4cc] to-[#5fe0d8]"
        />
      </div>
    </section>
  );
}

function Tile({
  href,
  title,
  body,
  samples,
  tone,
}: {
  href: string;
  title: string;
  body: string;
  samples: TemplateCard[];
  tone: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-3xl border border-line p-6 transition-shadow hover:shadow-[0_10px_40px_rgba(18,18,26,0.10)]"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${tone} opacity-[0.07]`} aria-hidden />

      <div className="relative">
        <p className="text-[20px] font-bold tracking-tight text-ink">{title}</p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{body}</p>

        {/* 이 종류로 만든 결과물 몇 개를 겹쳐 보여준다 */}
        <div className="mt-5 flex gap-2">
          {samples.slice(0, 4).map((sample) => (
            <div
              key={sample.slug}
              className="aspect-[9/16] w-[62px] overflow-hidden rounded-xl bg-surface-2 transition-transform duration-500 group-hover:-translate-y-1"
            >
              {sample.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sample.thumbnailUrl}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
          ))}
          {samples.length === 0 && (
            <p className="text-[13px] text-ink-faint">아직 등록된 게 없어요</p>
          )}
        </div>
      </div>
    </Link>
  );
}
