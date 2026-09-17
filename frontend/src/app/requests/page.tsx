import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState, PageShell } from "@/widgets/page-shell/PageShell";

export const metadata: Metadata = {
  title: "요청",
  description: "만들고 싶은데 없는 스타일이 있나요? 링크를 남겨주시면 템플릿으로 만들어 드려요.",
};

/**
 * 요청 게시판.
 *
 * 사용자에게는 "없는 걸 만들어 달라"는 창구이고, 운영자에게는 다음에 무엇을 만들지
 * 알려주는 트렌드 레이더다. 무엇을 만들지 감으로 정하지 않게 해준다.
 *
 * 빈 게시판은 죽은 공간이 되므로, 어떻게 쓰는 곳인지부터 보여준다.
 */
export default function RequestsPage() {
  return (
    <PageShell
      title="이런 거 만들어 주세요"
      description="만들고 싶은데 아직 없는 스타일이 있나요? 링크를 남겨주시면 프롬프트를 찾아 템플릿으로 만들어 드려요."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { step: "올려주세요", body: "인스타·틱톡·유튜브에서 본 영상 링크를 남겨주세요." },
          { step: "찾아볼게요", body: "어떻게 만들었는지 분석하고 직접 만들어 봐요." },
          { step: "템플릿이 돼요", body: "완성되면 알려드리고, 누구나 쓸 수 있게 올려요." },
        ].map((item) => (
          <div key={item.step} className="rounded-2xl border border-line p-5">
            <p className="text-[14px] font-semibold text-ink">{item.step}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <EmptyState
          title="아직 올라온 요청이 없어요"
          body="요청 게시판은 준비 중이에요. 곧 열어드릴게요."
          action={
            <Link
              href="/explore"
              className="inline-block rounded-full border border-line px-4 py-2 text-[14px] font-medium text-ink"
            >
              지금 있는 템플릿 보기
            </Link>
          }
        />
      </div>
    </PageShell>
  );
}
