import type { Metadata } from "next";
import { Items, NextStep, Note, Section } from "@/entities/guide/ui/GuideBody";
import { findGuide } from "@/entities/guide/model/guides";
import { PageShell } from "@/widgets/page-shell/PageShell";

const guide = findGuide("prompts")!;

export const metadata: Metadata = {
  title: guide.title,
  description: guide.summary,
};

/**
 * 프롬프트를 받아 가서 쓰는 법.
 *
 * "프롬프트를 샀는데 다른 데서 해보니 다르게 나와요"라는 문의가 있다. 숨기지 않고 왜
 * 그런지 적는다 - 프롬프트만으로는 같은 결과가 안 나온다는 것이 오히려 이 서비스가
 * 존재하는 이유이기도 하다.
 */
export default function Page() {
  return (
    <PageShell title={guide.title} description={guide.summary}>
      <article>
        <Section title="공개된 프롬프트는 가져가셔도 됩니다">
          <p>
            템플릿마다 프롬프트 공개 수준이 다릅니다. 공개로 열어둔 것은 복사해서 다른 AI
            도구에 그대로 넣으셔도 돼요. 제한을 두지 않습니다.
          </p>
          <p>
            열람한 프롬프트는 <strong className="text-ink">내 프롬프트</strong>에 남아서 언제든
            다시 꺼내 볼 수 있습니다.
          </p>
        </Section>

        <Section title="그런데 그대로 넣어도 다르게 나옵니다">
          <p>
            이게 가장 많이 받는 질문입니다. 같은 글을 넣었는데 왜 결과가 다르냐는 것이죠.
            이유는 여러 가지입니다.
          </p>
          <Items>
            <li>
              <strong className="text-ink">모델이 다릅니다.</strong> 같은 프롬프트라도 어떤
              AI에게 주느냐에 따라 결과가 완전히 달라져요
            </li>
            <li>
              <strong className="text-ink">설정값이 다릅니다.</strong> 비율, 해상도, 참조 강도
              같은 값이 결과를 크게 좌우합니다
            </li>
            <li>
              <strong className="text-ink">단계가 다릅니다.</strong> 프롬픽의 템플릿 중에는 한
              번에 끝나지 않고 여러 단계를 거치는 것이 있습니다. 1단계 결과를 2단계의 재료로
              넘기는 식이에요
            </li>
            <li>
              <strong className="text-ink">애초에 매번 다릅니다.</strong> 같은 도구에서 같은
              프롬프트를 두 번 넣어도 다르게 나옵니다
            </li>
          </Items>
          <Note>
            프롬프트는 결과를 만드는 재료 중 하나이지 설계도 전체가 아닙니다. 그래서 프롬프트를
            공개해도 괜찮고, 반대로 프롬프트만으로 같은 결과를 보장할 수도 없어요.
          </Note>
        </Section>

        <Section title="그럼 프롬프트는 왜 사나요">
          <p>
            솔직하게 말씀드리면, <strong className="text-ink">직접 만들어 보고 싶은 분</strong>을
            위한 것입니다. 어떤 단어가 어떤 분위기를 만드는지 배우는 데 쓰기 좋아요.
          </p>
          <p>
            결과물이 필요한 것이라면 프롬프트를 사실 이유가 없습니다. 그냥 만들기를 누르시는
            쪽이 빠르고, 결과도 그쪽이 낫습니다.
          </p>
        </Section>

        <Section title="프롬프트를 고쳐 쓰는 요령">
          <p>통째로 바꾸기보다 한 번에 한 군데씩 바꿔보세요. 무엇이 효과가 있었는지 알 수 있습니다.</p>
          <Items>
            <li>
              <strong className="text-ink">분위기를 나타내는 말</strong>을 먼저 바꿔보세요 —
              따뜻한, 차분한, 선명한 같은 것들이요
            </li>
            <li>
              <strong className="text-ink">빼고 싶은 것</strong>은 적지 않는 편이 낫습니다.
              &ldquo;모자 없이&rdquo;라고 적으면 오히려 모자가 나오는 일이 흔해요
            </li>
            <li>
              <strong className="text-ink">긴 문장보다 짧은 구절</strong>을 쉼표로 나열하는 편이
              대체로 잘 먹힙니다
            </li>
          </Items>
        </Section>

        <Section title="비공개인 프롬프트도 있습니다">
          <p>
            템플릿에 따라 프롬프트를 아예 제공하지 않는 것이 있어요. 만드는 데 들인 공이 그
            글에 다 들어가 있어서입니다.
          </p>
          <p>
            어떤 템플릿이 프롬프트를 주는지는 상세 화면에 표시되어 있으니, 프롬프트가 목적이라면
            열람하기 전에 확인해 주세요.
          </p>
        </Section>

        <NextStep href="/explore" label="템플릿 보러 가기">
          프롬프트가 공개된 템플릿은 상세 화면에서 바로 확인하실 수 있어요.
        </NextStep>
      </article>
    </PageShell>
  );
}
