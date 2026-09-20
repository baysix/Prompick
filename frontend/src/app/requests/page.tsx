import type { Metadata } from "next";
import { RequestBoardView } from "@/views/requests/RequestBoardView";
import { PageShell } from "@/widgets/page-shell/PageShell";

export const metadata: Metadata = {
  title: "요청",
  description: "만들고 싶은데 없는 스타일이 있나요? 링크를 남겨주시면 템플릿으로 만들어 드려요.",
};

/**
 * 요청 게시판.
 *
 * 사용자에게는 없는 걸 만들어 달라는 창구이고, 운영자에게는 다음에 무엇을 만들지 알려주는
 * 신호다. 무엇을 만들지 감으로 정하지 않게 해준다.
 */
export default function RequestsPage() {
  return (
    <PageShell
      title="이런 거 만들어 주세요"
      description="만들고 싶은데 아직 없는 스타일이 있나요? 링크를 남겨주시면 프롬프트를 찾아 템플릿으로 만들어 드려요. 같은 걸 원하는 사람이 많을수록 먼저 만들어요."
      wide
    >
      <RequestBoardView />
    </PageShell>
  );
}
