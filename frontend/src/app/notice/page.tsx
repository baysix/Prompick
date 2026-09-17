import type { Metadata } from "next";
import { EmptyState, PageShell } from "@/widgets/page-shell/PageShell";

export const metadata: Metadata = {
  title: "공지사항",
};

export default function NoticePage() {
  return (
    <PageShell title="공지사항" description="서비스 변경과 점검 소식을 알려드려요.">
      <EmptyState
        title="아직 공지가 없어요"
        body="서비스를 준비하는 중이에요. 중요한 변경이 있으면 여기에 먼저 올려드릴게요."
      />
    </PageShell>
  );
}
