import Link from "next/link";
import type { Metadata } from "next";
import { cn } from "@/shared/lib/cn";
import { PageShell } from "@/widgets/page-shell/PageShell";

export const metadata: Metadata = {
  title: "가격",
  description:
    "프롬비로 프롬프트를 열어 보거나 제작을 맡겨요. 무료 템플릿은 하루 3회까지 그냥 만들 수 있어요.",
};

/**
 * 가격.
 *
 * 충전 상품을 나란히 놓고 고르게 한다. 다만 구독제가 아니라 충전이라, 상품끼리 기능이
 * 다르지는 않다 — 더 내면 더 좋은 도구를 주는 게 아니라 그냥 더 많이 만들 수 있다.
 *
 * 그래서 칸마다 "이 상품에만 있는 기능"을 지어내지 않는다. 대신 이만큼이면 실제로 무엇을
 * 몇 번 만들 수 있는지와 프롬비 한 개당 얼마인지를 적는다. 고를 때 진짜 알고 싶은 것이
 * 그것이고, 없는 차이를 만들어 붙이면 결제하고 나서 속았다고 느낀다.
 */
interface Plan {
  audience: string;
  name: string;
  body: string;
  price: string;
  priceNote: string;
  cta: { label: string; href?: string };
  featuresTitle: string;
  features: string[];
  footnote?: string;
  recommended?: boolean;
}

const PLANS: Plan[] = [
  {
    audience: "처음이라면",
    name: "무료",
    body: "먼저 만들어 보세요. 결제 없이 결과물이 어떻게 나오는지 확인할 수 있어요.",
    price: "₩0",
    priceNote: "무료 템플릿 한정",
    cta: { label: "무료로 만들어 보기", href: "/explore?pricing=FREE" },
    featuresTitle: "무료로 이만큼 할 수 있어요",
    features: [
      "무료 템플릿 하루 3회 제작",
      "무료로 공개한 프롬프트 열람",
      "결과물 30일 보관",
      "실패하면 횟수 자동 복구",
    ],
    footnote: "무료로 만든 결과물에는 프롬픽 표시가 들어가요.",
  },
  {
    audience: "가볍게",
    name: "100 프롬비",
    body: "마음에 드는 템플릿 하나를 제대로 써볼 만큼이에요.",
    price: "₩3,000",
    priceNote: "프롬비 1개당 30원",
    cta: { label: "결제 준비 중" },
    featuresTitle: "100 프롬비로 할 수 있는 것",
    features: [
      "제작 약 1회",
      "또는 프롬프트 원문 1개 열기",
      "표시 없는 결과물",
      "실패하면 프롬비 자동 환불",
    ],
  },
  {
    audience: "자주 만든다면",
    name: "300 프롬비",
    body: "한 달에 몇 편씩 만드는 분들이 가장 많이 고르는 묶음이에요.",
    price: "₩9,000",
    priceNote: "프롬비 1개당 27원",
    cta: { label: "결제 준비 중" },
    featuresTitle: "330 프롬비로 할 수 있는 것",
    features: [
      "보너스 30 프롬비",
      "제작 약 3회",
      "표시 없는 결과물",
      "실패하면 프롬비 자동 환불",
    ],
    recommended: true,
  },
  {
    audience: "많이 만든다면",
    name: "1,000 프롬비",
    body: "채널을 운영하거나 상품 페이지를 계속 찍어내는 분들에게 맞아요.",
    price: "₩29,000",
    priceNote: "프롬비 1개당 25원",
    cta: { label: "결제 준비 중" },
    featuresTitle: "1,150 프롬비로 할 수 있는 것",
    features: [
      "보너스 150 프롬비",
      "제작 약 11회",
      "표시 없는 결과물",
      "실패하면 프롬비 자동 환불",
    ],
  },
];

export default function PricingPage() {
  return (
    <PageShell
      title="프롬비로 씁니다"
      description="프롬비는 프롬픽 안에서 쓰는 단위예요. 프롬프트를 열어 보거나 제작을 맡길 때 써요. 유효기간은 없어요."
      wide
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <PlanCard key={plan.name} plan={plan} />
        ))}
      </div>

      <p className="mt-4 text-[13px] leading-relaxed text-ink-faint">
        제작 횟수는 100 프롬비짜리 템플릿 기준이에요. 영상처럼 손이 많이 가는 템플릿은 한 번에
        300 프롬비까지 쓰기도 해요. 값은 템플릿마다 미리 적혀 있어요.
      </p>

      <Notes />
    </PageShell>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <section
      className={cn(
        "relative flex flex-col rounded-2xl border p-5",
        plan.recommended ? "border-accent bg-white/4" : "border-line",
      )}
    >
      {plan.recommended && (
        <span className="absolute -top-2.5 right-5 rounded-md bg-accent px-2.5 py-0.5 text-[11px] font-semibold text-accent-ink">
          추천
        </span>
      )}

      <p className="text-[12px] text-ink-soft">{plan.audience}</p>

      <h2 className="mt-2.5 text-[22px] font-bold tracking-[-0.03em] text-ink">{plan.name}</h2>

      <p className="mt-2 min-h-[60px] text-[13px] leading-relaxed text-ink-soft">{plan.body}</p>

      <p className="mt-4 text-[30px] font-bold tracking-[-0.04em] text-ink">{plan.price}</p>
      <p className="mt-1 text-[12px] text-ink-faint">{plan.priceNote}</p>

      <div className="mt-5">
        {plan.cta.href ? (
          <Link
            href={plan.cta.href}
            className="block rounded-lg bg-accent py-2.5 text-center text-[14px] font-semibold text-accent-ink transition-[filter] hover:brightness-105"
          >
            {plan.cta.label}
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="w-full rounded-lg bg-surface-2 py-2.5 text-[14px] font-medium text-ink-faint"
          >
            {plan.cta.label}
          </button>
        )}
      </div>

      <hr className="my-5 border-line" />

      <p className="text-[13px] font-semibold text-ink">{plan.featuresTitle}</p>

      <ul className="mt-3 space-y-2.5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
            <CheckIcon />
            {feature}
          </li>
        ))}
      </ul>

      {plan.footnote && (
        <p className="mt-4 text-[12px] leading-relaxed text-ink-faint">{plan.footnote}</p>
      )}
    </section>
  );
}

/** 결제 전에 반드시 알아야 하는 것들. 여기를 비워두면 그대로 문의가 된다 */
function Notes() {
  const NOTES = [
    "결제는 아직 열지 않았어요. 지금은 무료 템플릿으로 먼저 만들어 보세요.",
    "제작이 실패하면 쓴 프롬비는 자동으로 돌려드려요. 무료 횟수도 다시 채워져요.",
    "AI가 만드는 결과물이라 매번 조금씩 달라요. 마음에 안 든다고 환불되지는 않아요.",
    "결과물은 30일 동안 보관해요. 그 전에 내려받아 주세요.",
    "프롬비에는 유효기간이 없어요.",
  ];

  return (
    <section className="mt-10 rounded-2xl border border-line p-6">
      <h2 className="text-[16px] font-bold text-ink">알아두면 좋아요</h2>

      <ul className="mt-3 space-y-2.5">
        {NOTES.map((note) => (
          <li key={note} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-soft">
            <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
            {note}
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
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="mt-[3px] h-3.5 w-3.5 shrink-0 text-accent"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="m3 8.5 3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
