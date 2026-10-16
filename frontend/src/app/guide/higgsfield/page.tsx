import type { Metadata } from "next";
import Link from "next/link";
import { Compare, Items, NextStep, Note, Section } from "@/entities/guide/ui/GuideBody";
import { findGuide } from "@/entities/guide/model/guides";
import { SERVICE } from "@/shared/config/env";
import { PageShell } from "@/widgets/page-shell/PageShell";

const guide = findGuide("higgsfield")!;

export const metadata: Metadata = {
  title: guide.title,
  description: guide.summary,
};

/**
 * Higgsfield 에서 직접 만드는 법.
 *
 * 우리 사이트로 데려오려고 쓴 글이 아니다. 직접 해보고 싶은 사람에게 길을 알려주고,
 * 그 과정이 어떤지 먼저 보여준다. 다 읽고 "이건 내가 하면 되겠다" 싶으면 그렇게 하는
 * 것이 맞다 - 그래야 남아서 돈을 쓰는 사람도 알고 쓰는 것이 된다.
 *
 * 구독이 필요하다는 것을 맨 앞에 적는다. 무료 요금제로는 영상을 만들 수 없는데, 그것을
 * 글 끝에서 알게 되면 여기까지 읽은 시간이 통째로 버려진다.
 *
 * 화면 구성은 수시로 바뀐다. 그래서 버튼 이름을 외우게 하기보다 "무엇을 찾아야 하는지"로
 * 적었다. 메뉴 이름이 달라져도 찾을 것은 같다.
 */
export default function Page() {
  return (
    <PageShell title={guide.title} description={guide.summary}>
      <article>
        <Section title="이 글은 직접 해보고 싶은 분을 위한 거예요">
          <p>
            {SERVICE.name}의 영상 템플릿은 Higgsfield라는 곳의{" "}
            <strong className="text-ink">Genjutsu</strong>라는 기능을 씁니다. 저희가 대신
            돌려드리는 것이고, 같은 것을 직접 하실 수도 있어요.
          </p>
          <p>
            어느 쪽이 나은지는 상황에 따라 다릅니다. 이 글을 다 읽고 &ldquo;이건 내가 하면
            되겠다&rdquo; 싶으면 그렇게 하시면 돼요. 맨 아래에 두 방법을 비교해 두었습니다.
          </p>
        </Section>

        <Section title="먼저 — 무료로는 영상을 못 만들어요">
          <Note>
            Higgsfield의 무료 요금제는 <strong>크레딧이 0</strong>이라 영상 생성이 되지
            않습니다. 영상을 만들려면 유료 구독이 필요해요. 가입만 하고 둘러보는 건
            무료입니다.
          </Note>
          <p>
            2026년 10월 기준으로 가장 낮은 요금제가 월 $19(크레딧 270)입니다. 그 위로 $59,
            $129 요금제가 있어요.{" "}
            <strong className="text-ink">크레딧은 다음 달로 넘어가지 않고</strong> 결제일마다
            초기화됩니다.
          </p>
          <p>
            영상 한 편에 크레딧이 얼마나 드는지는 길이와 해상도에 따라 달라요. 짧게 480p로
            만들면 적게 들고, 길고 선명하게 만들수록 많이 듭니다. 정확한 금액은 만들기 직전
            화면에 표시되니 거기서 확인하세요.
          </p>
        </Section>

        <Section title="Genjutsu가 하는 일">
          <p>
            한 문장으로 하면{" "}
            <strong className="text-ink">
              &ldquo;이미 찍힌 영상의 움직임은 그대로 두고, 그 안의 사람이나 물건만 갈아
              끼우는 것&rdquo;
            </strong>
            입니다.
          </p>
          <p>
            새로 영상을 지어내는 게 아니에요. 춤추는 영상을 넣으면 그 춤과 카메라 움직임,
            조명, 타이밍은 원본 그대로 유지되고, 춤추는 사람의 얼굴과 옷만 내가 올린 사진으로
            바뀝니다. 그래서 결과가 자연스럽습니다 — 움직임은 사람이 실제로 찍은 것이니까요.
          </p>
          <p>기능이 두 가지로 나뉘어 있습니다.</p>
          <Items>
            <li>
              <strong className="text-ink">Motion Transfer</strong> — 움직임·카메라·타이밍만
              남기고 장면과 등장인물을 참조 사진으로 새로 만듭니다. 내 얼굴을 넣고 싶을 때
              쓰는 것이 이쪽이에요.
            </li>
            <li>
              <strong className="text-ink">Object Swap</strong> — 영상에서 지정한 것 하나(제품,
              소품, 옷 같은 것)만 바꾸고 나머지는 원본 그대로 둡니다.
            </li>
          </Items>
        </Section>

        <Section title="준비물 두 가지">
          <p>
            <strong className="text-ink">1. 바탕이 될 영상</strong> —{" "}
            <strong>4초에서 30초</strong> 사이여야 합니다. 30초가 넘으면 앞의 30초만 쓰이고
            뒤는 잘려요. 직접 찍은 영상도 되고, Higgsfield 안의 Community에서 다른 사람이
            올려둔 클립을 가져다 쓸 수도 있습니다.
          </p>
          <p>
            <strong className="text-ink">2. 바꿔 넣을 사진</strong> — 얼굴이 크고 또렷한 정면
            사진이 가장 잘 됩니다. 사이트에서는 한 번에 여러 장 올릴 수 있지만, 처음에는 한
            장으로 시작하세요.
          </p>
          <p>
            사진 고르는 요령은{" "}
            <Link href="/guide/photos" className="text-accent underline">
              어떤 사진을 올려야 잘 나올까
            </Link>
            에 따로 정리해 두었어요. 여기서도 그대로 통합니다.
          </p>
        </Section>

        <Section title="단계별로 해보기">
          <p>
            화면 구성은 수시로 바뀌니 버튼 이름을 외우기보다{" "}
            <strong className="text-ink">무엇을 찾아야 하는지</strong>를 기억하세요.
          </p>
          <Items>
            <li>
              <strong className="text-ink">1. 가입하고 구독하기</strong> — higgsfield.ai에서
              계정을 만들고 요금제를 고릅니다. 앞서 말씀드린 대로 무료로는 영상이 안
              만들어져요.
            </li>
            <li>
              <strong className="text-ink">2. Genjutsu 찾기</strong> — 상단 메뉴에 Genjutsu가
              있습니다. 영상 만들기 화면의 모델 고르는 자리에서 찾을 수도 있어요.
            </li>
            <li>
              <strong className="text-ink">3. Motion Transfer 고르기</strong> — 얼굴을 넣는
              것이 목적이면 Object Swap이 아니라 이쪽입니다.
            </li>
            <li>
              <strong className="text-ink">4. 바탕 영상 올리기</strong> — 4~30초짜리 영상
              하나를 올립니다. 직접 찍은 게 없으면 Community에서 마음에 드는 클립을 고르고
              Recreate를 누르면 그 영상이 그대로 불러와져요.{" "}
              <strong className="text-ink">처음 해보실 때는 이 방법을 추천합니다</strong> —
              이미 잘 되는 것이 확인된 영상이라 실패 확률이 낮습니다.
            </li>
            <li>
              <strong className="text-ink">5. 사진 올리기</strong> — 참조 이미지로 내 사진을
              넣습니다.
            </li>
            <li>
              <strong className="text-ink">6. 프리셋 고르거나 설명 적기</strong> — 프리셋이 30개
              넘게 준비돼 있고,{" "}
              <strong className="text-ink">프롬프트는 안 적어도 됩니다.</strong> 프리셋만으로도
              충분히 바뀌어요. 처음에는 적지 마세요.
            </li>
            <li>
              <strong className="text-ink">7. 해상도 고르고 만들기</strong> — 480p / 720p /
              1080p 중에 고릅니다. 선명할수록 크레딧이 많이 들어요. 연습할 때는 480p로 하세요.
            </li>
          </Items>
        </Section>

        <Section title="사람이 여럿 나오는 영상이라면">
          <p>
            영상에 사람이 두 명 이상이면 어느 사람을 바꿀지 말해줘야 합니다. 안 그러면 모델이
            아무나 고르거나 둘 다 바꿔버려요.
          </p>
          <p>이럴 때만 프롬프트를 짧게 적습니다. 이런 식이에요.</p>
          <Items>
            <li>
              <code className="rounded bg-surface px-1.5 py-0.5 text-[13px] text-ink">
                @Image 1 replaces the woman on frame right
              </code>{" "}
              — 첫 번째 사진이 화면 오른쪽 여자를 대체한다
            </li>
            <li>
              <code className="rounded bg-surface px-1.5 py-0.5 text-[13px] text-ink">
                @Image 1 replaces the person in the center
              </code>{" "}
              — 가운데 사람을 대체한다
            </li>
          </Items>
          <p>
            <strong className="text-ink">화면 기준 왼쪽·오른쪽</strong>으로 말하는 것이 가장 덜
            헷갈립니다. &ldquo;파란 옷 입은 사람&rdquo;처럼 생김새로 말해도 되지만, 옷 색이
            장면마다 바뀌면 어긋나요.
          </p>
        </Section>

        <Section title="자주 막히는 곳">
          <Compare
            good={[
              "4~30초짜리 영상",
              "얼굴이 크고 또렷한 정면 사진",
              "Community 클립으로 첫 시도",
              "프리셋만 쓰고 프롬프트는 비우기",
              "연습은 480p로",
            ]}
            bad={[
              "30초 넘는 긴 영상 (뒤가 잘려요)",
              "얼굴이 작게 나온 단체 사진",
              "움직임까지 프롬프트로 지시하기",
              "사람이 여럿인데 누구를 바꿀지 안 적기",
              "처음부터 1080p로 크레딧 태우기",
            ]}
          />
          <p>
            특히 <strong className="text-ink">움직임을 프롬프트로 지시하지 마세요.</strong>{" "}
            &ldquo;더 빠르게 춤추게&rdquo; 같은 말을 적으면 영상이 들고 있는 움직임과 싸워서
            결과가 망가집니다. 움직임은 바탕 영상이 정하는 것이고 프롬프트가 할 일이 아니에요.
          </p>
        </Section>

        <Section title="직접 할 때와 여기서 할 때">
          <p>솔직하게 적어둡니다.</p>
          <Items>
            <li>
              <strong className="text-ink">직접 하면</strong> — 바탕 영상을 마음대로 고를 수
              있고, 프리셋도 전부 쓸 수 있고, 여러 번 돌려보며 감을 잡을 수 있습니다. 대신 월
              구독료가 나가고, 영어 화면이고, 처음에는 크레딧을 꽤 날리게 돼요.
            </li>
            <li>
              <strong className="text-ink">여기서 하면</strong> — 바탕 영상과 설정을 미리 맞춰
              두었으니 사진만 올리면 됩니다. 구독 없이 건당으로 쓰고, 실패하면{" "}
              {SERVICE.creditUnit}를 돌려드려요. 대신 저희가 올려둔 템플릿 안에서만 됩니다.
            </li>
          </Items>
          <p>
            <strong className="text-ink">
              한두 번 만들어 볼 생각이면 여기가 싸고, 계속 만들 거라면 직접 구독하는 쪽이
              쌉니다.
            </strong>{" "}
            월 $19를 쓸 만큼 만들 것 같으면 직접 하시는 게 맞아요.
          </p>
        </Section>

        <NextStep href="/explore?contentType=VIDEO" label="영상 템플릿 보기">
          어떤 결과가 나오는지 먼저 보고 정하셔도 돼요. 저희 영상 템플릿은 바탕 영상과 설정이
          이미 맞춰져 있어서 사진 한 장만 올리면 됩니다.
        </NextStep>
      </article>
    </PageShell>
  );
}
