"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import type { AdminJobRow } from "@/entities/admin/model/types";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/widgets/admin-shell/Card";
import { JobDetailPanel } from "./JobDetailPanel";

/**
 * 제작 내역.
 *
 * 문의가 들어왔을 때 가장 먼저 여는 화면이다 — "어제 만들었는데 안 나왔어요"라는 말에 답하려면
 * 그 작업이 어디서 어떻게 끝났는지 볼 수 있어야 한다.
 *
 * 건마다 받은 프롬비와 나간 원가를 나란히 둔다. 어떤 템플릿이 손해를 내고 있는지는 합계가
 * 아니라 이 줄들에서 먼저 드러난다.
 *
 * 행을 누르면 그 건의 전체 기록이 열린다 — 어디서 깨졌는지, 프롬비가 어떻게 오갔는지,
 * 이미 돌려줬는지. 환불 판단에 필요한 것이 거기 다 있다.
 */
const TABS: { label: string; status?: string }[] = [
  { label: "전체" },
  { label: "진행 중", status: "RUNNING" },
  { label: "완료", status: "SUCCEEDED" },
  { label: "실패", status: "FAILED" },
];

export function AdminJobList() {
  const [tab, setTab] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const status = TABS[tab].status;

  const { data, isPending } = useQuery({
    queryKey: adminKeys.operationJobs(status),
    queryFn: () => adminApi.operationsJobs(status),
    refetchInterval: 15000,
  });

  const rows = data ?? [];

  return (
    <div>
      <div className="mb-4 flex gap-1">
        {TABS.map((t, i) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setTab(i)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-[13px] transition-colors",
              i === tab ? "bg-white/8 font-semibold text-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <p className="text-[13px] text-ink-faint">불러오는 중</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-line py-16 text-center text-[13px] text-ink-soft">
          아직 제작된 게 없어요.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-surface text-[12px] text-ink-soft">
                <Th>작업</Th>
                <Th>사용자</Th>
                <Th className="w-full">템플릿</Th>
                <Th className="text-right">받은 프롬비</Th>
                <Th className="text-right">나간 원가</Th>
                <Th>상태</Th>
                <Th>만든 때</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((job) => (
                <Row key={job.id} job={job} onOpen={() => setSelected(job.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected !== null && (
        <div className="mt-4">
          <JobDetailPanel jobId={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  );
}

function Row({ job, onOpen }: { job: AdminJobRow; onOpen: () => void }) {
  const free = job.chargeType === "FREE";
  const failed = job.status === "FAILED";

  return (
    <tr
      onClick={onOpen}
      className="cursor-pointer border-b border-line last:border-0 hover:bg-white/3"
    >
      <Td className="font-mono text-[12px] text-ink-faint">#{job.id}</Td>

      <Td>
        <span className="text-[13px] text-ink">{job.nickname}</span>
      </Td>

      <Td className="text-[13px] text-ink">{job.templateTitle}</Td>

      <Td className="text-right">
        {free ? (
          <span className="text-[13px] text-ink-faint">무료</span>
        ) : (
          <span className="font-mono text-[13px] text-ink">{job.creditCost}</span>
        )}
      </Td>

      <Td className="text-right">
        {/* 무료인데 원가가 나간 줄이 눈에 띄어야 한다. 매출 없이 나간 돈이다 */}
        <span
          className={cn(
            "font-mono text-[13px]",
            free && job.providerCost > 0 ? "text-paid" : "text-ink-soft",
          )}
        >
          {failed ? "-" : `${job.providerCost.toLocaleString()}원`}
        </span>
      </Td>

      <Td>
        <Badge
          tone={
            job.status === "SUCCEEDED" ? "good" : job.status === "FAILED" ? "warn" : "neutral"
          }
        >
          {job.status === "SUCCEEDED"
            ? "완료"
            : job.status === "FAILED"
              ? job.errorCode ?? "실패"
              : job.status === "RUNNING"
                ? "진행 중"
                : "대기"}
        </Badge>
      </Td>

      <Td className="whitespace-nowrap text-[12px] text-ink-faint">
        {new Date(job.createdAt).toLocaleString("ko-KR", {
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </Td>
    </tr>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-2.5 font-medium whitespace-nowrap", className)}>{children}</th>;
}

function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}
