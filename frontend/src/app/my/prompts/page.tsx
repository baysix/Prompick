import Link from "next/link";
import { EmptyState } from "@/widgets/page-shell/PageShell";

export default function Page() {
  return (
    <section>
      <p className="mb-5 text-[14px] text-ink-soft">프롬비로 열어 본 프롬프트를 여기서 다시 볼 수 있어요.</p>
      <EmptyState
        title="아직 열어 본 프롬프트가 없어요"
        body="무료로 공개한 템플릿부터 둘러보세요."
        action={
          <Link
            href="/explore"
            className="inline-block rounded-full bg-accent px-4 py-2 text-[14px] font-semibold text-accent-ink"
          >
            템플릿 둘러보기
          </Link>
        }
      />
    </section>
  );
}
