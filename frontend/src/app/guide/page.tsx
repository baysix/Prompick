import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/entities/guide/model/guides";
import { PageShell } from "@/widgets/page-shell/PageShell";

export const metadata: Metadata = {
  title: "가이드",
  description:
    "어떤 사진을 올려야 잘 나오는지, 결과가 매번 다른 이유는 무엇인지, 프롬프트는 어떻게 쓰는지 정리했어요.",
};

/**
 * 가이드 목록.
 *
 * 도움말(FAQ)과 나눠 둔다. FAQ는 막혔을 때 답을 찾는 곳이고 여기는 읽고 나면 더 잘 쓰게
 * 되는 글이다. 섞어두면 급한 사람은 긴 글에 치이고, 배우러 온 사람은 단답에 만족하지 못한다.
 */
export default function Page() {
  return (
    <PageShell
      title="가이드"
      description="조금만 알고 쓰면 결과가 꽤 달라져요. 오래 걸리지 않는 글들이에요."
    >
      <ul className="space-y-3">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/guide/${g.slug}`}
              className="block rounded-2xl border border-line px-5 py-5 transition-colors hover:border-ink-faint"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-[17px] font-bold leading-snug tracking-[-0.03em] text-ink">
                  {g.title}
                </h2>
                <span className="shrink-0 pt-0.5 text-[12px] text-ink-faint">{g.minutes}분</span>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{g.summary}</p>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-10 text-[13px] leading-relaxed text-ink-faint">
        막힌 것이 있으시면 <Link href="/help" className="text-accent underline">도움말</Link>에
        자주 묻는 질문을 모아두었어요.
      </p>
    </PageShell>
  );
}
