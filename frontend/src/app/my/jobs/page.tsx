import Link from "next/link";
import { EmptyState } from "@/widgets/page-shell/PageShell";

export default function Page() {
  return (
    <section>
      <p className="mb-5 text-[14px] text-ink-soft">만든 결과물이 여기 쌓여요. 30일 동안 보관해요.</p>
      <EmptyState
        title="아직 만든 게 없어요"
        body="템플릿을 골라 사진 한 장만 올리면 돼요."
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
