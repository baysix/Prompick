import type { Metadata } from "next";
import Link from "next/link";
import { Article, DraftNotice, Items, LegalDoc } from "@/entities/legal/ui/LegalDoc";
import { SERVICE } from "@/shared/config/env";
import { PageShell } from "@/widgets/page-shell/PageShell";

export const metadata: Metadata = { title: "이용약관" };

/**
 * 이용약관.
 *
 * 초안이다. 이 서비스에서 실제로 다투게 될 지점을 중심으로 적었다 - 결과물을 누가 어디까지
 * 쓸 수 있는지, 프롬비를 환불받을 수 있는지, 만든 것이 마음에 안 들면 어떻게 되는지.
 *
 * 베껴 온 조항으로 자리를 채우지 않았다. 지키지 않을 문장을 적어두면 분쟁에서 오히려
 * 불리해지고, 무엇보다 읽는 사람이 어디가 진짜인지 알 수 없게 된다.
 *
 * 시행일을 바꾸면 application.yml 의 prompick.legal.terms-version 도 함께 올린다.
 * 그래야 동의 기록이 어떤 문서를 가리키는지 되짚을 수 있다.
 */
export default function Page() {
  return (
    <PageShell title="이용약관">
      <DraftNotice />

      <LegalDoc version="2026-10-01">
        <Article title="제1조 (목적)">
          <p>
            이 약관은 {SERVICE.name}(이하 &ldquo;서비스&rdquo;)이 제공하는 AI 이미지·영상 제작과
            프롬프트 열람 기능을 이용할 때, 서비스와 회원 사이의 권리와 의무를 정합니다.
          </p>
        </Article>

        <Article title="제2조 (용어)">
          <Items>
            <li>
              <strong className="text-ink">템플릿</strong> — 결과물의 형태를 정해 둔 묶음입니다.
              사진을 올리면 이 틀에 맞춰 만들어집니다.
            </li>
            <li>
              <strong className="text-ink">프롬프트</strong> — 결과물을 만들 때 AI에게 주는 글입니다.
              템플릿마다 공개 여부가 다릅니다.
            </li>
            <li>
              <strong className="text-ink">{SERVICE.creditUnit}</strong> — 서비스 안에서만 쓰는
              재화입니다. 현금으로 바꿀 수 없습니다.
            </li>
            <li>
              <strong className="text-ink">결과물</strong> — 회원이 올린 사진을 재료로 만들어진
              이미지 또는 영상입니다.
            </li>
          </Items>
        </Article>

        <Article title="제3조 (가입)">
          <p>
            만 14세 이상이면 가입할 수 있습니다. 가입할 때 이 약관과 개인정보 수집·이용에
            동의해야 하며, 동의한 시점과 그때의 문서 버전을 기록합니다.
          </p>
          <p>
            닉네임은 다른 회원과 겹칠 수 없습니다. 다른 사람을 사칭하거나 오해를 줄 수 있는
            이름은 사전 통지 없이 바꿀 수 있습니다.
          </p>
        </Article>

        <Article title="제4조 (올리는 사진에 대한 책임)">
          <p>
            회원은 본인에게 사용 권한이 있는 사진만 올려야 합니다. 특히 다른 사람의 얼굴이 담긴
            사진은 그 사람의 동의를 받아야 하며, <strong className="text-ink">미성년자의 사진은
            법정대리인의 동의</strong>가 필요합니다.
          </p>
          <p>
            다음에 해당하는 사진은 올릴 수 없습니다. 확인되면 결과물과 함께 삭제하고 이용을
            제한할 수 있습니다.
          </p>
          <Items>
            <li>타인의 초상권·저작권을 침해하는 사진</li>
            <li>성적 수치심을 일으키거나 아동을 성적으로 대상화하는 사진</li>
            <li>폭력적이거나 혐오를 조장하는 사진</li>
            <li>타인을 속이기 위해 만들어질 것이 명백한 사진</li>
          </Items>
        </Article>

        <Article title="제5조 (결과물의 권리)">
          <p>
            결과물은 회원이 자유롭게 쓸 수 있습니다. 개인적 용도는 물론 상업적 용도로도 쓸 수
            있으며, 서비스는 이에 대해 별도의 대가를 요구하지 않습니다.
          </p>
          <p>
            다만 서비스는 결과물을 <strong className="text-ink">갤러리와 홍보에 쓸 수 있습니다</strong>.
            회원이 원하지 않으면 문의해 주시면 내립니다.
          </p>
          <p>
            AI가 만든 결과물의 저작권은 나라마다 법이 다르고 아직 정리되는 중입니다. 서비스는
            결과물에 저작권이 인정된다고 보장하지 않습니다.
          </p>
        </Article>

        <Article title="제6조 (프롬프트)">
          <p>
            템플릿마다 프롬프트 공개 수준이 다릅니다. 공개된 프롬프트는 받아 가서 다른 곳에서
            쓰실 수 있습니다.
          </p>
          <p>
            비공개이거나 유료인 프롬프트를 우회하여 얻으려는 시도 — 예를 들어 서비스의 응답을
            뜯어보거나 자동화 도구로 긁어 가는 행위 — 는 금지합니다.
          </p>
        </Article>

        <Article title={`제7조 (${SERVICE.creditUnit}와 환불)`}>
          <Items>
            <li>
              제작에 실패하면 사용한 {SERVICE.creditUnit}는{" "}
              <strong className="text-ink">자동으로 돌려드립니다</strong>. 따로 요청하지 않으셔도
              됩니다.
            </li>
            <li>
              결과물이 마음에 들지 않는 것은 환불 사유가 아닙니다. AI가 만드는 것이라 같은 사진과
              같은 설정으로도 매번 다른 결과가 나옵니다.
            </li>
            <li>
              구매 후 쓰지 않은 {SERVICE.creditUnit}는 결제일로부터 7일 이내에 환불받을 수 있습니다.
              일부라도 사용한 경우에는 남은 분에 대해서만 환불합니다.
            </li>
            <li>
              이미 열람한 프롬프트는 환불 대상이 아닙니다. 내용을 본 시점에 제공이 끝났기
              때문입니다.
            </li>
          </Items>
          <p>
            자세한 기준은 <Link href="/refund" className="text-accent underline">환불 정책</Link>에
            적혀 있습니다.
          </p>
        </Article>

        <Article title="제8조 (결과물의 보관)">
          <p>
            결과물은 만들어진 날로부터 <strong className="text-ink">30일 동안</strong> 보관하며,
            그 뒤에는 삭제합니다. 필요한 결과물은 기간 안에 내려받아 주세요.
          </p>
          <p>
            삭제된 결과물은 복구할 수 없습니다. 보관 기간이 지나 사라진 결과물에 대해서는
            {SERVICE.creditUnit}를 돌려드리지 않습니다.
          </p>
        </Article>

        <Article title="제9조 (서비스의 중단)">
          <p>
            점검이나 장애로 서비스가 멈출 수 있습니다. 예정된 점검은 미리 공지하며, 점검 중에는
            새 제작을 받지 않습니다.
          </p>
          <p>
            외부 AI 제공사의 사정으로 특정 템플릿을 제공하지 못할 수 있습니다. 이 경우 해당
            템플릿을 내리고, 그때 진행 중이던 제작은 {SERVICE.creditUnit}를 돌려드립니다.
          </p>
        </Article>

        <Article title="제10조 (이용 제한)">
          <p>다음의 경우 사전 통지 없이 이용을 제한하거나 계정을 정지할 수 있습니다.</p>
          <Items>
            <li>제4조에서 금지한 사진을 반복해서 올리는 경우</li>
            <li>계정을 여러 개 만들어 무료 횟수를 반복해서 쓰는 경우</li>
            <li>자동화 도구로 서비스에 부담을 주는 경우</li>
            <li>제6조에서 금지한 방법으로 프롬프트를 얻으려는 경우</li>
          </Items>
        </Article>

        <Article title="제11조 (책임의 한계)">
          <p>
            서비스는 결과물이 특정한 품질이나 용도에 맞을 것을 보장하지 않습니다. AI 제작의 성질상
            같은 입력에도 결과가 달라집니다.
          </p>
          <p>
            회원이 올린 사진이나 만들어진 결과물을 서비스 밖에서 사용하여 생긴 분쟁은 회원의
            책임입니다.
          </p>
          <p>
            서비스의 고의나 중대한 과실로 회원에게 손해가 생긴 경우에는 법이 정하는 바에 따라
            책임집니다.
          </p>
        </Article>

        <Article title="제12조 (약관의 변경)">
          <p>
            약관이 바뀌면 시행일 7일 전부터 공지합니다. 회원에게 불리한 변경은 30일 전부터
            공지하며, 그 기간에 거절 의사를 밝히지 않으면 동의한 것으로 봅니다.
          </p>
          <p>바뀐 약관에 동의하지 않으시면 언제든 탈퇴하실 수 있습니다.</p>
        </Article>

        <Article title="부칙">
          <p>이 약관은 2026년 10월 1일부터 시행합니다.</p>
        </Article>
      </LegalDoc>
    </PageShell>
  );
}
