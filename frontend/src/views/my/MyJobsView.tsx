"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { generationApi, generationKeys } from "@/entities/generation/api/generationApi";
import { isFinished, type Job, type JobStatus } from "@/entities/generation/model/types";
import { cn } from "@/shared/lib/cn";
import { EmptyState } from "@/widgets/page-shell/PageShell";

/**
 * 내 작업함.
 *
 * 진행 중인 작업이 있으면 목록을 계속 새로고침한다. 이 화면을 열어두고 기다리는 경우가
 * 많기 때문이다. 모두 끝났으면 멈춘다.
 */
const TABS: { label: string; status?: JobStatus }[] = [
  { label: "전체" },
  { label: "진행 중", status: "RUNNING" },
  { label: "완료", status: "SUCCEEDED" },
  { label: "실패", status: "FAILED" },
];

export function MyJobsView() {
  const [tab, setTab] = useState(0);
  const status = TABS[tab].status;

  const { data, isPending } = useQuery({
    queryKey: generationKeys.jobs(status),
    queryFn: () => generationApi.jobs(status),
    refetchInterval: (query) =>
      query.state.data?.some((j) => !isFinished(j.status)) ? 3000 : false,
  });

  return (
    <section>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {TABS.map((t, i) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setTab(i)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-[13px] transition-colors",
              i === tab ? "bg-white/10 font-semibold text-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <p className="py-20 text-center text-[13px] text-ink-faint">불러오는 중</p>
      ) : !data || data.length === 0 ? (
        <EmptyState title="아직 만든 게 없어요" body="템플릿을 골라 사진 한 장만 올리면 돼요." />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {data.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </ul>
      )}
    </section>
  );
}

function JobCard({ job }: { job: Job }) {
  const output = job.outputs[0];

  return (
    <li>
      <Link href={`/jobs/${job.id}`} className="group block">
        <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-surface">
          {output ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={output.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center px-3 text-center text-[12px] leading-relaxed text-ink-faint">
              {job.statusMessage}
            </span>
          )}

          {!isFinished(job.status) && (
            <span className="absolute left-2 top-2 rounded-md bg-accent px-2 py-0.5 text-[10px] font-semibold text-accent-ink">
              만드는 중
            </span>
          )}
          {job.status === "FAILED" && (
            <span className="absolute left-2 top-2 rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-medium text-ink-soft">
              실패
            </span>
          )}
        </div>

        <p className="mt-2 truncate text-[13px] font-medium text-ink group-hover:underline">
          {job.templateTitle}
        </p>
        <p className="mt-0.5 text-[11px] text-ink-faint">
          {new Date(job.createdAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
          {job.chargeType === "FREE" ? " · 무료" : ` · 🪙 ${job.creditCost}`}
        </p>
      </Link>
    </li>
  );
}
