import { EmptyState } from "@/widgets/page-shell/PageShell";

export default function Page() {
  return (
    <section>
      <p className="mb-5 text-[14px] text-ink-soft">받아 간 프롬프트는 언제든 다시 볼 수 있어요.</p>
      <EmptyState title="아직 받아 간 프롬프트가 없어요" body="프롬프트를 공개한 템플릿에서 원문을 받아 갈 수 있어요." />
    </section>
  );
}
