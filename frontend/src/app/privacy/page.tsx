import type { Metadata } from "next";
import Link from "next/link";
import { Article, DraftNotice, Items, LegalDoc, Table } from "@/entities/legal/ui/LegalDoc";
import { SERVICE } from "@/shared/config/env";
import { PageShell } from "@/widgets/page-shell/PageShell";

export const metadata: Metadata = { title: "개인정보처리방침" };

/**
 * 개인정보처리방침.
 *
 * 초안이다. 실제로 수집하고 있는 것만 적었다 - users 테이블과 uploads·outputs 버킷에
 * 무엇이 들어가는지 그대로다.
 *
 * 받지도 않는 항목을 "수집할 수 있습니다"로 적어두지 않았다. 그렇게 적으면 나중에 받아도
 * 된다고 생각하게 되고, 결국 쓰지도 않을 정보를 모으게 된다.
 *
 * 시행일을 바꾸면 application.yml 의 prompick.legal.privacy-version 도 함께 올린다.
 */
export default function Page() {
  return (
    <PageShell title="개인정보처리방침">
      <DraftNotice />

      <LegalDoc version="2026-10-01">
        <Article title="1. 무엇을 모으나요">
          <p>서비스를 쓰는 데 꼭 필요한 것만 받습니다.</p>
          <Table
            head={["언제", "항목", "필수", "왜"]}
            rows={[
              [
                "가입할 때",
                "이메일, 비밀번호, 닉네임",
                "필수",
                "로그인하고, 결과물이 사라지기 전에 알려드리기 위해",
              ],
              [
                "가입할 때",
                "동의 여부와 시각, 문서 버전",
                "필수",
                "무엇에 동의하셨는지 되짚기 위해",
              ],
              [
                "무료 제작을 처음 쓸 때",
                "휴대폰 본인인증 결과(CI의 해시값)",
                "필수",
                "계정을 여러 개 만들어 무료 횟수를 반복해 쓰는 것을 막기 위해",
              ],
              [
                "제작할 때",
                "올리신 사진·영상, 만들어진 결과물",
                "필수",
                "결과물을 만들고 보관하기 위해",
              ],
              ["가입할 때", "광고 수신 동의", "선택", "새 템플릿 소식을 보내드리기 위해"],
              [
                "쓰는 동안",
                "접속 기록, 마지막 로그인 시각",
                "자동 수집",
                "부정 이용을 확인하고 장애를 찾기 위해",
              ],
            ]}
          />
          <p>
            <strong className="text-ink">이름, 생년월일, 성별, 주소는 받지 않습니다.</strong> 만 14세
            이상인지는 가입할 때 확인란으로 갈음합니다.
          </p>
          <p>
            <strong className="text-ink">본인인증을 해도 휴대폰 번호와 이름은 저장하지 않습니다.</strong>{" "}
            인증기관이 주는 고유식별값(CI)을 되돌릴 수 없는 형태로 바꿔 저장하고, 같은 사람인지
            비교하는 데에만 씁니다.
          </p>
          <p>
            <strong className="text-ink">카드번호나 계좌번호는 받지 않습니다.</strong> 결제는 결제
            대행사가 처리하며, 서비스는 결제가 끝났다는 사실만 전달받습니다.
          </p>
        </Article>

        <Article title="2. 어디에 쓰나요">
          <Items>
            <li>회원을 식별하고 로그인 상태를 유지하는 데</li>
            <li>올리신 사진으로 결과물을 만드는 데</li>
            <li>{SERVICE.creditUnit} 잔액과 사용 내역을 관리하는 데</li>
            <li>결과물이 곧 사라진다는 것, 점검이 예정됐다는 것을 알리는 데</li>
            <li>무료 횟수를 반복해서 쓰는 등 부정 이용을 막는 데</li>
            <li>(동의하신 경우에만) 새 템플릿 소식을 보내는 데</li>
          </Items>
          <p>
            위에 적지 않은 목적으로 쓰지 않습니다. 쓸 일이 생기면 그때 따로 동의를 받습니다.
          </p>
        </Article>

        <Article title="3. 얼마나 가지고 있나요">
          <Table
            head={["항목", "보관 기간"]}
            rows={[
              ["회원 정보 (이메일, 닉네임 등)", "탈퇴할 때까지"],
              ["올리신 사진·영상", "제작이 끝난 뒤 30일"],
              ["만들어진 결과물", "만들어진 날로부터 30일"],
              ["동의 기록", "탈퇴 후 5년 (전자상거래법)"],
              ["결제·환불 기록", "5년 (전자상거래법)"],
              ["접속 기록", "3개월 (통신비밀보호법)"],
              [
                "본인인증 식별값의 해시",
                "탈퇴 후 1년 — 탈퇴와 재가입을 반복해 무료 횟수를 다시 받는 것을 막기 위해",
              ],
            ]}
          />
          <p>
            기간이 지나면 되살릴 수 없는 방법으로 지웁니다. 파일은 저장소에서 삭제하고, 데이터베이스
            기록은 행을 지웁니다.
          </p>
        </Article>

        <Article title="4. 누구에게 넘기나요">
          <p>
            회원의 개인정보를 다른 곳에 팔거나 넘기지 않습니다. 다만 서비스를 돌리기 위해 아래
            업체의 도움을 받고 있으며, 각자 맡은 일에 필요한 만큼만 전달됩니다.
          </p>
          <Table
            head={["업체", "맡은 일", "전달되는 것"]}
            rows={[
              ["Supabase", "회원 인증, 데이터베이스, 파일 저장", "이메일, 회원 정보, 올리신 사진과 결과물"],
              ["Amazon Web Services", "서버 운영 (서울 리전)", "서비스 이용 중 오가는 모든 정보"],
              ["OpenAI 등 AI 제공사", "결과물 제작", "올리신 사진과 제작에 필요한 설정값"],
            ]}
          />
          <p>
            <strong className="text-ink">
              올리신 사진은 결과물을 만들기 위해 AI 제공사의 서버로 전송됩니다.
            </strong>{" "}
            제공사에 따라 서버가 국외에 있을 수 있습니다. 제작에 쓰인 뒤 제공사 쪽에서 어떻게
            처리되는지는 각 제공사의 방침을 따릅니다.
          </p>
        </Article>

        <Article title="5. 어린이의 사진">
          <p>
            이 서비스에는 아기와 어린이 사진을 쓰는 템플릿이 많습니다. 그래서 아래를 따로
            말씀드립니다.
          </p>
          <Items>
            <li>
              <strong className="text-ink">
                미성년자의 사진은 법정대리인의 동의를 받아 올려주세요.
              </strong>
            </li>
            <li>올리신 사진과 결과물은 30일 뒤 지워집니다.</li>
            <li>
              결과물을 갤러리에 쓰지 않기를 원하시면 문의해 주세요. 바로 내리고 다시 쓰지
              않습니다.
            </li>
            <li>만 14세 미만은 회원으로 가입할 수 없습니다.</li>
          </Items>
        </Article>

        <Article title="6. 회원이 할 수 있는 것">
          <Items>
            <li>
              <strong className="text-ink">내 정보 보기와 고치기</strong> — 마이페이지에서 닉네임을
              바꿀 수 있습니다.
            </li>
            <li>
              <strong className="text-ink">결과물 지우기</strong> — 보관 기간 전이라도 직접 지울 수
              있습니다.
            </li>
            <li>
              <strong className="text-ink">광고 수신 철회</strong> — 언제든 끌 수 있고, 끈 시점도
              기록에 남습니다.
            </li>
            <li>
              <strong className="text-ink">탈퇴</strong> — 탈퇴하면 회원 정보와 결과물을 지웁니다.
              다만 법이 보관을 요구하는 결제 기록 등은 위 기간 동안 남습니다.
            </li>
          </Items>
          <p>
            처리를 멈춰 달라거나 지워 달라는 요청은{" "}
            <Link href="/report" className="text-accent underline">문의</Link>를 통해 주시면
            지체 없이 처리합니다.
          </p>
        </Article>

        <Article title="7. 어떻게 지키나요">
          <Items>
            <li>올리신 사진과 결과물은 비공개 저장소에 두고, 짧게 만료되는 주소로만 내려받습니다.</li>
            <li>AI 제공사의 키는 되돌릴 수 없는 방식으로 봉인해 보관합니다.</li>
            <li>모든 통신은 암호화(HTTPS)합니다.</li>
            <li>운영자만 회원 정보에 닿을 수 있으며, 그 권한은 필요한 사람에게만 줍니다.</li>
            <li>비밀번호는 서비스 서버를 거치지 않고 인증 제공사가 직접 받아 보관합니다.</li>
          </Items>
        </Article>

        <Article title="8. 쿠키">
          <p>
            로그인 상태를 유지하기 위해 쿠키를 씁니다. 광고를 위한 추적은 하지 않습니다. 브라우저
            설정에서 쿠키를 막으면 로그인이 유지되지 않습니다.
          </p>
        </Article>

        <Article title="9. 바뀔 때">
          <p>
            이 방침이 바뀌면 시행일 7일 전부터 공지합니다. 회원에게 중요한 변경은 30일 전부터
            공지합니다.
          </p>
        </Article>

        <Article title="10. 문의">
          <p>
            개인정보에 관한 문의는{" "}
            <Link href="/report" className="text-accent underline">문의하기</Link>로 보내주세요.
            개인정보 보호책임자와 연락처는 사업자 등록 후 이 자리에 적습니다.
          </p>
        </Article>

        <Article title="부칙">
          <p>이 방침은 2026년 10월 1일부터 시행합니다.</p>
        </Article>
      </LegalDoc>
    </PageShell>
  );
}
