import type { Metadata } from "next";
import { Items, NextStep, Note, Section } from "@/entities/guide/ui/GuideBody";
import { findGuide } from "@/entities/guide/model/guides";
import { PageShell } from "@/widgets/page-shell/PageShell";

const guide = findGuide("results")!;

export const metadata: Metadata = {
  title: guide.title,
  description: guide.summary,
};

/**
 * 결과가 매번 다른 이유.
 *
 * "환불해 주세요"로 들어오는 문의의 뿌리가 대부분 여기다. 고장이라고 생각하니까 환불을
 * 요구하게 되는데, 원래 그런 것임을 알면 다시 한 번 만들어 보는 쪽으로 간다.
 *
 * 그래서 변명이 아니라 설명으로 쓴다. 왜 그런지를 모르면 "원래 그렇습니다"는 그냥
 * 발뺌으로 읽힌다.
 */
export default function Page() {
  return (
    <PageShell title={guide.title} description={guide.summary}>
      <article>
        <Section title="두 번 만들면 두 번 다릅니다">
          <p>
            같은 사진, 같은 템플릿, 아무것도 바꾸지 않고 다시 만들어도 결과가 달라집니다. 이건
            고장이 아니라 AI 이미지 제작의 성질이에요.
          </p>
          <p>
            AI는 매번 <strong className="text-ink">무작위한 점들에서 시작해서</strong> 그것을
            그림으로 다듬어 갑니다. 시작점이 다르면 도착점도 달라져요. 같은 요리사에게 같은
            재료로 같은 요리를 두 번 부탁하는 것과 비슷합니다 — 비슷하지만 똑같지는 않죠.
          </p>
        </Section>

        <Section title="그래서 어떤 점이 달라지나요">
          <Items>
            <li>
              <strong className="text-ink">표정과 시선</strong> — 가장 많이 달라지는 부분입니다
            </li>
            <li>
              <strong className="text-ink">배경의 작은 요소</strong> — 소품 위치, 무늬, 글자
            </li>
            <li>
              <strong className="text-ink">빛의 방향과 세기</strong>
            </li>
            <li>
              <strong className="text-ink">닮은 정도</strong> — 아쉽게도 이것도 매번 조금씩 달라요
            </li>
          </Items>
          <p>
            반대로 크게 달라지지 않는 것도 있습니다. 템플릿이 정한 구도, 비율, 전체적인 분위기는
            대체로 유지됩니다. 그걸 고정하려고 템플릿을 만드는 것이니까요.
          </p>
        </Section>

        <Section title="글자가 이상하게 나오는 건 왜인가요">
          <p>
            AI는 글자를 &ldquo;쓰는&rdquo; 것이 아니라 <strong className="text-ink">글자처럼
            보이는 모양을 그립니다.</strong> 그래서 한글이든 영어든 자세히 보면 무너져 있는
            경우가 많아요.
          </p>
          <p>
            글자가 중요한 결과물이라면, 글자가 들어가도록 설계된 템플릿을 고르시는 편이
            낫습니다. 그런 템플릿은 글자를 따로 얹는 단계를 거치거든요.
          </p>
        </Section>

        <Section title="마음에 안 들면 어떻게 하나요">
          <Note>
            결과가 마음에 들지 않는 것은 환불 사유가 아닙니다. 다만{" "}
            <strong>실패해서 아무것도 안 나온 경우에는 프롬비를 자동으로 돌려드려요.</strong>{" "}
            따로 요청하지 않으셔도 됩니다.
          </Note>
          <p>
            이 둘을 나누는 이유가 있습니다. 만드는 데 드는 비용은 결과가 마음에 들든 안 들든
            똑같이 나가거든요. 마음에 들 때까지 무료로 다시 만들어 드리면 그 비용을 감당할
            방법이 없고, 결국 모두의 요금이 올라갑니다.
          </p>
          <p>대신 이렇게 해보시면 확률이 올라갑니다.</p>
          <Items>
            <li>
              <strong className="text-ink">사진을 바꿔보세요.</strong> 같은 사진으로 다시 만드는
              것보다, 다른 각도로 찍힌 사진을 쓰는 쪽이 훨씬 크게 달라집니다
            </li>
            <li>
              <strong className="text-ink">예시를 먼저 보세요.</strong> 템플릿 상세의 예시가 그
              템플릿이 잘하는 것을 보여줍니다
            </li>
            <li>
              <strong className="text-ink">무료 템플릿으로 감을 잡으세요.</strong> 하루에 무료로
              만들 수 있는 횟수가 있습니다
            </li>
          </Items>
        </Section>

        <Section title="시간이 오래 걸리는 것도 정상인가요">
          <p>
            템플릿에 따라 1분에서 3분 정도 걸립니다. 여러 단계를 거치는 템플릿은 더 걸리기도
            해요.
          </p>
          <p>
            <strong className="text-ink">창을 닫으셔도 됩니다.</strong> 제작은 서버에서 계속
            진행되고, 나중에 내 제작 내역에서 결과를 확인하실 수 있어요.
          </p>
          <p>
            너무 오래 걸리면 서버가 알아서 정리하고 프롬비를 돌려드립니다. 영원히 기다리게
            두지는 않아요.
          </p>
        </Section>

        <NextStep href="/guide/photos" label="사진 고르는 법 보기">
          결과를 가장 크게 바꾸는 건 사실 어떤 사진을 올리느냐입니다. 다음 글에서 자세히
          다뤘어요.
        </NextStep>
      </article>
    </PageShell>
  );
}
