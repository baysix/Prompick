"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/shared/api/client";
import { useSession } from "@/shared/auth/SessionProvider";
import { Button, ButtonLink } from "@/shared/ui/Button";

/**
 * 오류 신고.
 *
 * 남의 신고는 보이지 않는다. 고치기 전의 신고에는 "이렇게 하면 남의 작업이 보인다" 같은 것이
 * 적히고, 그것을 게시판에 걸어두면 고칠 때까지 그 글이 곧 공격 안내문이 된다. 대신 자기가 올린
 * 신고와 거기 달린 답은 볼 수 있다 — 답이 안 보이면 두 번 다시 신고하지 않는다.
 *
 * 화면 주소는 사람이 적지 않는다. 어디서 눌러 들어왔는지를 주소에 실어 보내고 여기서 채운다.
 * 기억해서 적은 위치는 자주 틀리고, 틀리면 재현하는 데 드는 시간이 배로 든다.
 */
interface MyReport {
  id: number;
  title: string;
  body: string;
  pageUrl: string | null;
  statusLabel: string;
  adminNote: string | null;
  createdAt: string;
}

const reportKeys = { mine: ["bug-reports", "mine"] as const };

export function BugReportView() {
  const { signedIn, loading } = useSession();
  const from = useSearchParams().get("from");

  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  const { data: mine } = useQuery({
    queryKey: reportKeys.mine,
    queryFn: () => api.get<MyReport[]>("/bug-reports/mine"),
    enabled: signedIn,
  });

  const submit = useMutation({
    mutationFn: () =>
      api.post<MyReport>("/bug-reports", {
        title: title.trim(),
        body: body.trim(),
        // 신고 화면 자체의 주소가 아니라, 문제가 난 화면의 주소여야 의미가 있다.
        pageUrl: from ?? (typeof document === "undefined" ? null : document.referrer || null),
      }),
    onSuccess: () => {
      setTitle("");
      setBody("");
      setSent(true);
      void queryClient.invalidateQueries({ queryKey: reportKeys.mine });
    },
  });

  if (loading) {
    return <p className="py-16 text-center text-[13px] text-ink-faint">확인 중</p>;
  }

  if (!signedIn) {
    return (
      <div className="rounded-xl border border-line p-6">
        <p className="text-[15px] font-semibold text-ink">로그인이 필요해요</p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
          고치다가 되묻게 되는 일이 많아서, 답을 드릴 수 있는 분에게만 받고 있어요.
        </p>
        <ButtonLink href="/login?next=/report" className="mt-5" size="sm">
          로그인
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        {from && (
          <p className="rounded-lg bg-white/5 px-3.5 py-2.5 text-[12px] text-ink-soft">
            신고할 화면: <span className="font-mono break-all">{from}</span>
          </p>
        )}

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">
            무슨 일이 있었나요
          </span>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSent(false);
            }}
            maxLength={160}
            placeholder="한 줄로 요약해 주세요"
            className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-ink-faint"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-ink-soft">자세히</span>
          <textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setSent(false);
            }}
            rows={7}
            maxLength={5000}
            placeholder={"무엇을 하다가 그랬는지 순서대로 적어주시면 가장 빨리 고칠 수 있어요.\n\n예) 사진을 올리고 만들기를 눌렀더니 화면이 하얗게 변했어요."}
            className="w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-[14px] leading-relaxed text-ink outline-none placeholder:text-ink-faint focus:border-ink-faint"
          />
        </label>

        {submit.isError && (
          <p className="text-[13px] text-paid">
            {submit.error instanceof ApiError ? submit.error.message : "보내지 못했어요."}
          </p>
        )}

        {sent && (
          <p className="rounded-lg bg-accent/10 px-3.5 py-2.5 text-[13px] text-accent">
            보내주셔서 고마워요. 확인하고 아래에 답을 남길게요.
          </p>
        )}

        <Button
          size="lg"
          disabled={submit.isPending || !title.trim() || !body.trim()}
          onClick={() => submit.mutate()}
        >
          {submit.isPending ? "보내는 중" : "보내기"}
        </Button>
      </section>

      {mine && mine.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-semibold text-ink">내가 보낸 신고</h2>
          <div className="space-y-2.5">
            {mine.map((report) => (
              <div key={report.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[14px] font-medium text-ink">{report.title}</h3>
                  <span className="rounded-md bg-white/6 px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
                    {report.statusLabel}
                  </span>
                  <time className="ml-auto text-[12px] text-ink-faint">
                    {new Date(report.createdAt).toLocaleDateString("ko-KR")}
                  </time>
                </div>

                {report.adminNote && (
                  <p className="mt-2.5 border-t border-line pt-2.5 text-[13px] leading-relaxed text-ink-soft">
                    {report.adminNote}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
