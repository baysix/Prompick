import type { Metadata } from "next";
import { PageShell } from "@/widgets/page-shell/PageShell";

export const metadata: Metadata = {
  title: "도움말",
  description: "제작이 실패했을 때, 사진이 올라가지 않을 때, 프롬비가 어떻게 쓰이는지 알려드려요.",
};

/**
 * 도움말.
 *
 * 문의가 가장 많이 몰릴 지점을 먼저 답해둔다 — 실패, 환불, 사진 업로드.
 * 이 셋은 돈과 직결되어서, 답이 없으면 그대로 이탈이나 문의로 이어진다.
 */
const FAQ = [
  {
    q: "만들다가 실패하면 프롬비는 어떻게 되나요?",
    a: "자동으로 돌려드려요. 무료 템플릿이었다면 오늘의 무료 횟수도 다시 채워져요. 시스템이나 AI 쪽 문제로 결과가 나오지 않은 경우가 여기에 해당해요.",
  },
  {
    q: "결과가 마음에 안 들면 환불되나요?",
    a: "그건 어려워요. AI가 만드는 결과물이라 매번 조금씩 다르고, 같은 프롬프트로도 다르게 나와요. 대신 예시를 충분히 보여드리고, 어떤 사진을 올리면 잘 나오는지 가이드를 드려요.",
  },
  {
    q: "사진이 올라가지 않아요",
    a: "JPG·PNG·WEBP 형식에 10MB 이하여야 해요. 너무 작은 사진은 결과가 뭉개져서 막아두었어요. 템플릿마다 요구하는 최소 크기가 조금씩 달라요.",
  },
  {
    q: "프롬프트를 사면 계속 볼 수 있나요?",
    a: "네. 한 번 열면 계속 볼 수 있어요. 내 프롬프트에서 언제든 다시 꺼내 보세요.",
  },
  {
    q: "어떤 AI를 쓰나요?",
    a: "템플릿마다 달라요. 여러 AI를 단계별로 조합해서 쓰는 경우도 있어요. 어떤 걸 쓰는지는 공개하지 않지만, 그래서 프롬프트만 복사해서 쓰는 것보다 결과가 좋아요.",
  },
  {
    q: "만든 결과물은 얼마나 보관되나요?",
    a: "30일이에요. 그 전에 내려받아 주세요. 직접 지우고 싶으면 언제든 지울 수 있어요.",
  },
];

export default function HelpPage() {
  return (
    <PageShell title="도움말" description="자주 묻는 것들을 모았어요.">
      <dl className="divide-y divide-line">
        {FAQ.map((item) => (
          <div key={item.q} className="py-5 first:pt-0">
            <dt className="text-[15px] font-semibold text-ink">{item.q}</dt>
            <dd className="mt-2 text-[14px] leading-relaxed text-ink-soft">{item.a}</dd>
          </div>
        ))}
      </dl>
    </PageShell>
  );
}
