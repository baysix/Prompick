import type { Metadata } from "next";
import { api } from "@/shared/api/client";
import { EmptyState, PageShell } from "@/widgets/page-shell/PageShell";

export const metadata: Metadata = {
  title: "공지사항",
};

// 점검 안내는 올리자마자 보여야 한다. 캐시가 끼면 "올렸는데 왜 안 보이냐"가 된다.
export const dynamic = "force-dynamic";

interface Notice {
  id: number;
  title: string;
  body: string;
  pinned: boolean;
  publishedAt: string;
}

export default async function NoticePage() {
  let notices: Notice[] = [];

  // 공지를 못 불러왔다고 화면 전체가 오류가 되면, 정작 장애 때 읽을 것이 사라진다.
  try {
    notices = await api.get<Notice[]>("/notices");
  } catch {
    notices = [];
  }

  return (
    <PageShell title="공지사항" description="서비스 변경과 점검 소식을 알려드려요.">
      {notices.length === 0 ? (
        <EmptyState
          title="아직 공지가 없어요"
          body="중요한 변경이 있으면 여기에 먼저 올려드릴게요."
        />
      ) : (
        <div className="space-y-3">
          {notices.map((notice) => (
            <article key={notice.id} className="rounded-xl border border-line p-5">
              <div className="flex flex-wrap items-center gap-2">
                {notice.pinned && (
                  <span className="rounded-md bg-accent/15 px-2 py-0.5 text-[11px] font-semibold text-accent">
                    중요
                  </span>
                )}
                <h2 className="text-[16px] font-semibold text-ink">{notice.title}</h2>
                <time className="ml-auto text-[12px] text-ink-faint">
                  {new Date(notice.publishedAt).toLocaleDateString("ko-KR")}
                </time>
              </div>

              <p className="mt-3 text-[14px] leading-relaxed whitespace-pre-wrap text-ink-soft">
                {notice.body}
              </p>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
