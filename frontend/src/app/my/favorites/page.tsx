import Link from "next/link";
import { EmptyState } from "@/widgets/page-shell/PageShell";

export default function Page() {
  return (
    <section>
      <p className="mb-5 text-[14px] text-ink-soft">나중에 만들려고 찜해둔 템플릿이에요.</p>
      <EmptyState
        title="찜한 템플릿이 없어요"
        body="마음에 드는 걸 찜해두면 여기 모여요."
        action={
          <Link
            href="/explore"
            className="bg-brand inline-block rounded-full px-4 py-2 text-[14px] font-semibold text-accent-ink"
          >
            템플릿 둘러보기
          </Link>
        }
      />
    </section>
  );
}
