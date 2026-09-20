import type { Metadata } from "next";
import { Suspense } from "react";
import { BugReportView } from "@/views/report/BugReportView";
import { PageShell } from "@/widgets/page-shell/PageShell";

export const metadata: Metadata = {
  title: "오류 신고",
};

export default function ReportPage() {
  return (
    <PageShell
      title="오류 신고"
      description="이상하게 동작한 것을 알려주세요. 무엇을 하다 그랬는지까지 적어주시면 가장 빨리 고칠 수 있어요."
    >
      <Suspense fallback={<p className="py-16 text-center text-[13px] text-ink-faint">불러오는 중</p>}>
        <BugReportView />
      </Suspense>
    </PageShell>
  );
}
