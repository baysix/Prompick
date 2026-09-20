import { EmptyState } from "@/widgets/page-shell/PageShell";

export default function Page() {
  return (
    <section>
      <p className="mb-5 text-[14px] text-ink-soft">충전하고 쓴 내역을 모두 볼 수 있어요.</p>
      <EmptyState title="아직 내역이 없어요" body="충전하면 여기에 기록이 남아요." />
    </section>
  );
}
