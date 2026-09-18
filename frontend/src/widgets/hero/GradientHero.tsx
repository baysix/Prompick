import Link from "next/link";
import type { TemplateCard } from "@/entities/template/model/types";

/**
 * 첫 화면.
 *
 * 그라데이션이 영역 전체를 덮고 글자는 흰색이다. 흰 배경에 글자만 색을 입히는 것보다
 * 먼저 눈에 들어오고, 아래로 이어지는 흰 본문과 경계가 분명해진다.
 *
 * 버튼은 하나만 둔다. 둘을 나란히 두면 고르는 일이 먼저 생기는데, 처음 온 사람에게
 * 필요한 건 선택이 아니라 시작이다. 다른 길(프롬프트만 받아 가기)은 아래 목록에서 만난다.
 */
export function GradientHero({ samples }: { samples: TemplateCard[] }) {
  return (
    <section className="bg-brand relative overflow-hidden">
      <div className="mx-auto max-w-5xl px-4 pb-0 pt-16 text-center sm:pt-24">
        <h1 className="text-[34px] font-bold leading-[1.15] tracking-tight text-white sm:text-[56px]">
          릴스에서 본 그 영상,
          <br />
          사진 한 장이면 돼요
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-white/85 sm:text-[18px]">
          유행하는 AI 영상과 이미지의 프롬프트를 모았어요.
          <br className="hidden sm:block" /> 원문을 받아 가서 직접 만들거나, 사진만 올리고 맡기면 돼요.
        </p>

        <Link
          href="/explore"
          className="mt-8 inline-block rounded-full bg-white px-7 py-3.5 text-[16px] font-semibold text-ink"
        >
          무료로 시작하기
        </Link>

        {/* 결과물을 살짝 걸쳐 놓는다. 무엇을 만드는 곳인지 글보다 빨리 전해진다 */}
        {samples.length > 0 && (
          <div className="mt-12 flex justify-center gap-3 sm:mt-16" aria-hidden>
            {samples.slice(0, 5).map((sample, i) => (
              <div
                key={sample.slug}
                className="aspect-[9/16] w-[88px] overflow-hidden rounded-t-2xl bg-white/10 sm:w-[132px]"
                style={{ transform: `translateY(${Math.abs(i - 2) * 14}px)` }}
              >
                {sample.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={sample.thumbnailUrl}
                    alt=""
                    loading={i < 3 ? "eager" : "lazy"}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
