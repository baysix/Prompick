import Link from "next/link";

/**
 * 히어로.
 *
 * 문구로 서비스를 설명하는 대신, 이 서비스에서 실제로 일어나는 일을 보여준다.
 * 폰으로 찍은 밋밋한 사진 한 장이 광고 영상이 되는 순간이다.
 *
 * 화면 전체에서 유일한 자동 모션이고, 진입 시 한 번만 재생된다. 반복하지 않는 이유는
 * 계속 움직이는 화면이 아래 목록의 결과물들과 시선을 다투기 때문이다.
 * 상태 없이 CSS만으로 처리하므로 이 컴포넌트는 서버에서 그려진다.
 */
export function TransformHero() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:py-16 md:grid-cols-[1fr_auto] md:items-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-[28px] font-semibold leading-[1.25] tracking-tight text-ink sm:text-[34px]">
            릴스에서 본 그 영상,
            <br />
            사진 한 장이면 돼요.
          </h1>
          <p className="text-[15px] leading-relaxed text-ink-soft">
            유행하는 AI 영상과 이미지의 프롬프트를 모았어요. 원문을 그대로 받아 가서 직접 만들거나,
            사진만 올리고 맡기면 돼요.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/explore"
              className="rounded-sm bg-accent px-4 py-2.5 text-[14px] font-medium text-accent-ink"
            >
              뭐가 있는지 둘러보기
            </Link>
            <Link
              href="/explore?promptOnly=true"
              className="rounded-sm border border-line px-4 py-2.5 text-[14px] font-medium text-ink"
            >
              프롬프트만 보기
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-5">
          <BeforeFrame />
          <Arrow />
          <AfterFrame />
        </div>
      </div>
    </section>
  );
}

/** 올리는 것: 폰으로 대충 찍은 제품 사진 */
function BeforeFrame() {
  return (
    <figure className="w-[104px] shrink-0 sm:w-[132px]">
      <div className="relative aspect-[9/16] overflow-hidden bg-[#cfd2c9]">
        {/* 평범한 실내 촬영: 어수선한 배경, 평평한 조명 */}
        <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[#b9bdb2]" />
        <div className="absolute left-1/2 top-1/2 h-[34%] w-[30%] -translate-x-1/2 -translate-y-1/2 rounded-[3px] bg-[#8e9389]" />
        <div className="absolute left-1/2 top-[64%] h-[6%] w-[36%] -translate-x-1/2 rounded-[50%] bg-black/15 blur-[2px]" />
      </div>
      <figcaption className="mt-2 text-[11px] text-ink-faint">올린 사진</figcaption>
    </figure>
  );
}

/** 나오는 것: 배경과 조명이 새로 만들어진 광고 컷 */
function AfterFrame() {
  return (
    <figure className="w-[104px] shrink-0 sm:w-[132px]">
      <div className="hero-reveal relative aspect-[9/16] overflow-hidden bg-[#2a3b34]">
        <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_38%,#5d7a6d_0%,#243129_70%)]" />
        <div className="hero-lift absolute left-1/2 h-[34%] w-[30%] -translate-x-1/2 rounded-[3px] bg-[#e7e3d8] shadow-[0_0_24px_rgba(255,255,255,0.28)]" />
        <div className="hero-shadow absolute left-1/2 h-[4%] w-[26%] -translate-x-1/2 rounded-[50%] bg-black/40 blur-[3px]" />
      </div>
      <figcaption className="mt-2 text-[11px] text-ink-faint">만들어진 영상</figcaption>
    </figure>
  );
}

function Arrow() {
  return (
    <svg
      viewBox="0 0 28 12"
      className="hero-reveal h-3 w-7 shrink-0 text-ink"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden
    >
      <path d="M0 6h24M19 1.5 24.5 6 19 10.5" />
    </svg>
  );
}
