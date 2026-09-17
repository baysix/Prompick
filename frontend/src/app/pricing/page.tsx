import Link from "next/link";
import type { Metadata } from "next";
import { PageShell } from "@/widgets/page-shell/PageShell";

export const metadata: Metadata = {
  title: "가격",
  description: "프롬비로 프롬프트를 열어 보거나 제작을 맡겨요. 무료 템플릿은 하루 3회까지 그냥 만들 수 있어요.",
};

/**
 * 가격 안내.
 *
 * 이 화면의 목적은 상품을 파는 게 아니라 "프롬비가 뭔지" 이해시키는 것이다.
 * 처음 온 사람은 화폐 단위부터 낯설고, 그걸 모르면 결제까지 가지 못한다.
 * 그래서 충전 상품보다 "무엇에 얼마가 드는지"를 먼저 보여준다.
 */
const USES = [
  {
    title: "프롬프트 받아 가기",
    price: "무료 또는 100",
    body: "원문을 그대로 복사해서 쓰던 AI에 붙여넣어요. 한 번 열면 계속 볼 수 있어요.",
    note: "무료로 공개한 템플릿은 로그인만 하면 돼요",
  },
  {
    title: "대신 만들어 드리기",
    price: "무료 또는 100~300",
    body: "사진만 올리면 결과물이 나와요. 어떤 AI를 몇 단계로 쓰는지는 신경 쓰지 않아도 돼요.",
    note: "무료 템플릿은 하루 3회까지",
  },
];

const PLANS = [
  { credits: 100, price: 3000, bonus: 0 },
  { credits: 300, price: 9000, bonus: 30, popular: true },
  { credits: 1000, price: 29000, bonus: 150 },
];

export default function PricingPage() {
  return (
    <PageShell
      title="프롬비로 씁니다"
      description="프롬비는 프롬픽 안에서 쓰는 단위예요. 프롬프트를 열어 보거나 제작을 맡길 때 써요."
    >
      <section className="grid gap-4 sm:grid-cols-2">
        {USES.map((use) => (
          <div key={use.title} className="rounded-2xl border border-line p-6">
            <p className="text-[15px] font-semibold text-ink">{use.title}</p>
            <p className="mt-3 text-[24px] font-bold tracking-tight text-ink">
              <span aria-hidden>🪙</span> {use.price}
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">{use.body}</p>
            <p className="mt-2 text-[13px] text-ink-faint">{use.note}</p>
          </div>
        ))}
      </section>

      <section className="mt-12">
        <h2 className="text-[19px] font-bold tracking-tight text-ink">충전하기</h2>
        <p className="mt-1.5 text-[14px] text-ink-soft">많이 충전할수록 보너스를 더 드려요.</p>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.credits}
              className={
                plan.popular
                  ? "relative rounded-2xl border-2 border-accent bg-accent-soft/40 p-6"
                  : "rounded-2xl border border-line p-6"
              }
            >
              {plan.popular && (
                <span className="absolute -top-2.5 left-6 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-ink">
                  많이 골라요
                </span>
              )}
              <p className="text-[22px] font-bold tracking-tight text-ink">
                <span aria-hidden>🪙</span> {plan.credits.toLocaleString()}
                {plan.bonus > 0 && (
                  <span className="ml-1.5 text-[14px] font-semibold text-accent">
                    +{plan.bonus}
                  </span>
                )}
              </p>
              <p className="mt-1.5 text-[15px] text-ink-soft">
                {plan.price.toLocaleString()}원
              </p>
              <button
                type="button"
                disabled
                className="mt-5 w-full rounded-full bg-surface-2 py-2.5 text-[14px] font-medium text-ink-faint"
              >
                결제 준비 중
              </button>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-ink-faint">
          결제는 아직 열지 않았어요. 지금은 무료 템플릿으로 먼저 만들어 보세요.
        </p>
      </section>

      <section className="mt-12 rounded-2xl border border-line bg-surface p-6">
        <h2 className="text-[16px] font-bold text-ink">알아두면 좋아요</h2>
        <ul className="mt-3 space-y-2.5">
          {[
            "제작이 실패하면 쓴 프롬비는 자동으로 돌려드려요. 무료 횟수도 다시 채워져요.",
            "AI가 만드는 결과물이라 매번 조금씩 달라요. 마음에 안 든다고 환불되지는 않아요.",
            "결과물은 30일 동안 보관해요. 그 전에 내려받아 주세요.",
            "프롬비에는 유효기간이 없어요.",
          ].map((line) => (
            <li key={line} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-soft">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
              {line}
            </li>
          ))}
        </ul>
        <Link
          href="/refund"
          className="mt-4 inline-block text-[13px] font-medium text-accent hover:underline"
        >
          환불정책 자세히 보기
        </Link>
      </section>
    </PageShell>
  );
}
