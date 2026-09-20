import { EmptyState } from "@/widgets/page-shell/PageShell";

export default function Page() {
  return (
    <section>
      <p className="mb-5 text-[14px] text-ink-soft">나중에 만들려고 찜해둔 템플릿이에요.</p>
      <EmptyState title="아직 찜한 게 없어요" body="마음에 드는 템플릿을 찜해두면 여기 모여요." />
    </section>
  );
}
