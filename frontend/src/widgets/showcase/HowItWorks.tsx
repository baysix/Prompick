import Link from "next/link";

/**
 * 만드는 법.
 *
 * 처음 온 사람이 가장 먼저 품는 의심은 "내가 할 수 있나"이다. 세 컷으로 끝난다는 걸
 * 보여주는 게 어떤 설명보다 빠르다.
 *
 * 번호를 붙인 이유는 장식이 아니라 실제로 순서가 있기 때문이다.
 */
const STEPS = [
  {
    title: "마음에 드는 걸 고르고",
    body: "예시 결과물을 보고 고르면 돼요. 프롬프트만 받아 갈 수도 있어요.",
  },
  {
    title: "사진 한 장 올리면",
    body: "어떤 사진이 잘 나오는지 알려드려요. 올리는 즉시 확인해 드려요.",
  },
  {
    title: "기다리면 나와요",
    body: "몇 분이면 돼요. 창을 닫아도 계속 만들어지고, 실패하면 돌려드려요.",
  },
];

export function HowItWorks() {
  return (
    <section className="border-y border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
        <h2 className="text-[22px] font-bold tracking-tight text-ink sm:text-[28px]">
          어렵지 않아요
        </h2>
        <p className="mt-2 text-[15px] text-ink-soft">
          프로그램을 깔거나 프롬프트를 공부할 필요 없어요.
        </p>

        <ol className="mt-8 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, i) => (
            <li key={step.title} className="rounded-2xl bg-ground p-6">
              <span className="bg-brand inline-flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-bold text-accent-ink">
                {i + 1}
              </span>
              <p className="mt-4 text-[17px] font-semibold text-ink">{step.title}</p>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8">
          <Link
            href="/explore?pricing=FREE"
            className="bg-brand inline-block rounded-full px-6 py-3 text-[15px] font-semibold text-accent-ink"
          >
            무료로 하나 만들어 보기
          </Link>
        </div>
      </div>
    </section>
  );
}

/** 마지막으로 한 번 더 권하는 자리 */
export function ClosingCta() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
      <div className="bg-brand overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12">
        <h2 className="text-[26px] font-bold leading-snug tracking-tight text-white sm:text-[34px]">
          오늘 하나는 무료예요
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-white/85">
          사진 한 장만 있으면 돼요. 마음에 안 들어도 잃는 건 없어요.
        </p>
        <Link
          href="/explore?pricing=FREE"
          className="mt-7 inline-block rounded-full bg-white px-7 py-3 text-[15px] font-semibold text-ink"
        >
          무료 템플릿 보기
        </Link>
      </div>
    </section>
  );
}
