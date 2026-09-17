import type { Metadata } from "next";
import { PageShell } from "@/widgets/page-shell/PageShell";

export const metadata: Metadata = { title: "개인정보처리방침" };

/**
 * 개인정보처리방침.
 *
 * 결제를 열려면 반드시 있어야 하는 문서다. 내용은 법률 검토를 거쳐 채운다.
 * 자리를 비워두면 심사 단계에서 발목을 잡히므로 경로부터 만들어 둔다.
 */
export default function Page() {
  return (
    <PageShell title="개인정보처리방침">
      <div className="rounded-2xl border border-line bg-surface px-6 py-12 text-center">
        <p className="text-[15px] font-semibold text-ink">준비 중이에요</p>
        <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-soft">
          결제를 열기 전까지 법률 검토를 거쳐 채워 넣을 문서예요.
        </p>
      </div>
    </PageShell>
  );
}
