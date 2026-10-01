import type { Metadata } from "next";
import { Compare, Items, NextStep, Section } from "@/entities/guide/ui/GuideBody";
import { findGuide } from "@/entities/guide/model/guides";
import { PageShell } from "@/widgets/page-shell/PageShell";

const guide = findGuide("photos")!;

export const metadata: Metadata = {
  title: guide.title,
  description: guide.summary,
};

/**
 * 사진 고르는 법.
 *
 * 문의 중 가장 많은 것이 "결과가 이상해요"인데, 열어보면 대부분 올린 사진에서 갈린다.
 * 그래서 제작 화면의 짧은 안내만으로는 부족하고, 왜 그런지까지 적어둔 글이 하나 필요했다.
 */
export default function Page() {
  return (
    <PageShell title={guide.title} description={guide.summary}>
      <article>
        <Section title="결과물의 절반은 사진에서 정해져요">
          <p>
            AI는 올린 사진을 재료로 씁니다. 재료에 없는 것은 만들어낼 수 없어요. 얼굴이 흐리게
            찍힌 사진을 주면 아무리 좋은 템플릿을 골라도 흐린 얼굴이 나옵니다.
          </p>
          <p>
            바꿔 말하면, <strong className="text-ink">사진을 한 장 더 신경 써서 고르는 것이
            템플릿을 바꾸는 것보다 결과를 크게 바꿉니다.</strong> 아래 네 가지만 지켜도 체감이
            달라져요.
          </p>
        </Section>

        <Section title="1. 얼굴은 정면에 가깝게, 크게">
          <p>
            옆얼굴이나 고개를 많이 숙인 사진은 AI가 이목구비를 추측해야 합니다. 추측이 들어가면
            원래 얼굴과 멀어져요. &ldquo;우리 아기 같지 않다&rdquo;는 느낌은 대개 여기서 옵니다.
          </p>
          <p>
            얼굴이 사진에서 차지하는 비율도 중요합니다. 전신 사진에서 얼굴이 손톱만 하면, 그
            작은 부분을 키워 쓰는 셈이라 뭉개집니다.
          </p>
          <Compare
            good={[
              "얼굴이 화면의 1/4 이상을 차지하는 사진",
              "정면이나 살짝 돌린 각도",
              "눈이 또렷하게 보이는 사진",
            ]}
            bad={[
              "완전한 옆모습",
              "멀리서 찍은 전신 사진",
              "고개를 푹 숙이거나 돌린 사진",
            ]}
          />
        </Section>

        <Section title="2. 빛은 앞에서, 그늘 없이">
          <p>
            창을 등지고 찍으면 얼굴이 어두워집니다. 사람 눈에는 괜찮아 보여도 AI에게는 정보가
            적은 사진이에요. 어두운 부분은 AI가 지어내게 됩니다.
          </p>
          <p>
            가장 쉬운 방법은 <strong className="text-ink">창을 바라보게 하고 찍는 것</strong>입니다.
            흐린 날 창가가 제일 좋아요. 직사광선은 그림자가 세게 져서 오히려 어렵습니다.
          </p>
          <Items>
            <li>형광등 바로 아래는 눈 밑에 그늘이 집니다</li>
            <li>얼굴 절반만 빛을 받는 사진은 피해주세요</li>
            <li>플래시를 정면에서 터뜨린 사진은 입체감이 사라집니다</li>
          </Items>
        </Section>

        <Section title="3. 해상도는 크면 클수록">
          <p>
            카카오톡이나 인스타그램에서 내려받은 사진은 이미 한 번 줄어든 상태입니다. 겉보기엔
            멀쩡해도 확대하면 뭉개져 있어요.
          </p>
          <p>
            <strong className="text-ink">가능하면 휴대폰 갤러리의 원본</strong>을 쓰세요. 프롬픽은
            10MB까지 받고, 너무 작은 사진은 아예 막아둡니다 — 올려봐야 결과가 아쉬울 것이
            뻔한데 프롬비를 쓰게 할 수는 없으니까요.
          </p>
        </Section>

        <Section title="4. 가리는 것이 적을수록">
          <p>
            마스크, 손, 긴 앞머리, 모자챙 — 얼굴을 가리는 것이 있으면 그 아래를 AI가 상상합니다.
            특히 입과 턱선이 가려지면 닮은 정도가 크게 떨어져요.
          </p>
          <p>
            안경은 괜찮지만 빛이 반사되어 눈이 안 보이는 사진은 피해주세요.
          </p>
        </Section>

        <Section title="여러 명이 나온 사진은 어떤가요">
          <p>
            템플릿마다 다릅니다. 한 사람을 전제로 만든 템플릿에 여러 명이 나온 사진을 올리면,
            AI가 누구를 주인공으로 볼지 정하지 못해 얼굴이 섞이기도 해요.
          </p>
          <p>
            템플릿 상세 화면의 <strong className="text-ink">&ldquo;이렇게 찍어 주세요&rdquo;</strong>에
            그 템플릿이 바라는 사진이 적혀 있습니다. 올리기 전에 한 번 보시면 좋아요.
          </p>
        </Section>

        <Section title="올리고 나면 바로 알려드려요">
          <p>
            사진을 올리면 그 자리에서 검사합니다. 너무 작거나, 형식이 맞지 않거나, 얼굴을 찾지
            못하면 만들기 전에 알려드려요. 다 만들고 나서 실패하면 시간도 프롬비도 버리게 되니까요.
          </p>
        </Section>

        <NextStep href="/explore" label="템플릿 둘러보기">
          사진 준비가 됐다면, 어떤 결과물이 나오는지 먼저 구경해 보세요. 템플릿마다 필요한
          사진이 조금씩 달라요.
        </NextStep>
      </article>
    </PageShell>
  );
}
