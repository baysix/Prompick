import type { Metadata } from "next";
import Link from "next/link";
import { Items, Section } from "@/entities/guide/ui/GuideBody";
import { SERVICE } from "@/shared/config/env";
import { PageShell } from "@/widgets/page-shell/PageShell";

export const metadata: Metadata = {
  title: "소개",
  description:
    "프롬픽이 무엇을 하는 서비스인지, 누가 쓰는지, 올린 사진을 어떻게 다루는지 적어두었어요.",
};

/**
 * 소개.
 *
 * 두 가지를 분명히 하려고 만든 페이지다.
 *
 * 하나는 이 서비스가 무엇인지 - 결과물만 늘어놓은 화면으로는 처음 온 사람이 무엇을 하는
 * 곳인지 알기 어렵다.
 *
 * 다른 하나는 누가 쓰는지다. 예시에 아기 사진이 많아서 아이를 겨냥한 서비스로 오해받기
 * 쉬운데, 실제로 쓰는 사람은 아이의 사진을 가진 어른이다. 이 구분은 광고 정책이나 심사
 * 단계에서 실제로 문제가 되는 지점이라 글로 적어둔다.
 */
export default function Page() {
  return (
    <PageShell
      title={`${SERVICE.name} 소개`}
      description="유행하는 AI 사진·영상을, 사진 한 장으로 따라 만들 수 있게 하는 서비스예요."
    >
      <article>
        <Section title="무엇을 하는 곳인가요">
          <p>
            인스타그램이나 쇼츠에서 &ldquo;이거 어떻게 만든 거지?&rdquo; 싶은 사진과 영상을
            보신 적 있을 거예요. {SERVICE.name}은 그런 결과물을 만드는 방법을 템플릿으로 정리해
            둔 곳입니다.
          </p>
          <p>쓰는 방법은 두 가지예요.</p>
          <Items>
            <li>
              <strong className="text-ink">사진을 맡기기</strong> — 사진 한 장을 올리면 그
              템플릿에 맞춰 대신 만들어 드려요. AI 도구를 다룰 줄 몰라도 됩니다.
            </li>
            <li>
              <strong className="text-ink">프롬프트를 받아 가기</strong> — 직접 만들어 보고 싶은
              분을 위해, 템플릿에 따라 프롬프트를 공개합니다. 가져가서 다른 도구에 쓰셔도 돼요.
            </li>
          </Items>
        </Section>

        <Section title="누가 쓰나요">
          <p>
            <strong className="text-ink">사진을 가진 어른이 씁니다.</strong> 아이의 사진으로
            만드는 템플릿이 많아 화면에 아기 사진이 자주 보이지만, 서비스를 쓰는 사람은 그
            사진을 찍은 부모예요.
          </p>
          <p>
            그래서 <strong className="text-ink">만 14세 미만은 가입할 수 없습니다.</strong> 또한
            다른 사람의 얼굴이 담긴 사진을 올릴 때는 그 사람의 동의가 필요하고, 미성년자의
            사진은 법정대리인의 동의가 필요합니다.
          </p>
          <p>
            돌 사진, 명절 가족사진, 프로필 사진처럼 한 번 만들어 두고 오래 쓰는 결과물을 주로
            만드십니다.
          </p>
        </Section>

        <Section title="올린 사진은 어떻게 되나요">
          <Items>
            <li>
              결과물을 만드는 데에만 씁니다. 다른 용도로 쓰거나 다른 곳에 팔지 않습니다.
            </li>
            <li>
              올리신 사진과 만들어진 결과물은 <strong className="text-ink">30일 뒤 지워집니다.</strong>{" "}
              그 전에 직접 지우실 수도 있어요.
            </li>
            <li>
              결과물을 갤러리에 쓰지 않기를 원하시면 말씀해 주세요. 바로 내립니다.
            </li>
            <li>
              사진은 비공개 저장소에 두고, 짧게 만료되는 주소로만 내려받습니다.
            </li>
          </Items>
          <p>
            자세한 내용은{" "}
            <Link href="/privacy" className="text-accent underline">
              개인정보처리방침
            </Link>
            에 적어두었습니다.
          </p>
        </Section>

        <Section title="왜 프롬프트만 주지 않나요">
          <p>
            프롬프트는 재료 중 하나일 뿐이라서요. 같은 글이라도 어떤 AI에게 주느냐, 어떤 설정을
            쓰느냐, 몇 단계를 거치느냐에 따라 결과가 완전히 달라집니다.
          </p>
          <p>
            템플릿은 그 조합을 정리해 둔 것입니다. 그래서 프롬프트를 공개해도 괜찮고, 반대로
            프롬프트만으로 같은 결과를 보장할 수도 없어요. 이 이야기는{" "}
            <Link href="/guide/prompts" className="text-accent underline">
              가이드
            </Link>
            에 더 자세히 적었습니다.
          </p>
        </Section>

        <Section title="돈은 어떻게 받나요">
          <p>
            하루에 몇 번은 무료로 만들 수 있습니다. 그 이상은 {SERVICE.creditUnit}라는 서비스
            안의 재화를 씁니다.
          </p>
          <p>
            만드는 데에는 실제로 비용이 듭니다. 결과물 하나를 만들 때마다 AI 제공사에 요금이
            나가요. {SERVICE.creditUnit}는 그 비용을 나누기 위한 것이지, 쓸 때마다 이익을
            남기려는 구조가 아닙니다.
          </p>
          <p>
            만들다 실패하면 {SERVICE.creditUnit}는 자동으로 돌려드립니다. 자세한 기준은{" "}
            <Link href="/refund" className="text-accent underline">
              환불 정책
            </Link>
            에 있습니다.
          </p>
        </Section>

        <Section title="문의">
          <p>
            오류를 발견하셨거나 원하는 템플릿이 있으시면{" "}
            <Link href="/report" className="text-accent underline">
              문의하기
            </Link>
            로 알려주세요. 요청 게시판에 올라온 템플릿은 실제로 만들어지기도 합니다.
          </p>
        </Section>
      </article>
    </PageShell>
  );
}
