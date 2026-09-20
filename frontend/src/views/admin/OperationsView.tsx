"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import type { OperationsSummary } from "@/entities/admin/model/types";
import { cn } from "@/shared/lib/cn";
import { Card } from "@/widgets/admin-shell/Card";

/**
 * 매출과 원가.
 *
 * 제작이 늘었다는 소식은 그 자체로는 좋은 소식도 나쁜 소식도 아니다. 받은 프롬비보다 나간 AI
 * 요금이 크면 많이 만들수록 손해다. 그래서 두 숫자를 항상 붙여서 보여준다.
 *
 * 무료 제작은 따로 뗀다. 매출이 0인데 원가는 그대로 나가기 때문에, 전체에 섞어두면 마진이
 * 줄어드는 이유가 보이지 않는다.
 */
const RANGES = [
  { days: 1, label: "오늘" },
  { days: 7, label: "7일" },
  { days: 30, label: "30일" },
];

export function OperationsView() {
  const [days, setDays] = useState(7);

  const { data, isPending } = useQuery({
    queryKey: adminKeys.operations(days),
    queryFn: () => adminApi.operationsSummary(days),
  });

  return (
    <div className="space-y-5">
      <div className="flex gap-1">
        {RANGES.map((range) => (
          <button
            key={range.days}
            type="button"
            onClick={() => setDays(range.days)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-[13px] transition-colors",
              days === range.days
                ? "bg-white/8 font-semibold text-ink"
                : "text-ink-soft hover:text-ink",
            )}
          >
            {range.label}
          </button>
        ))}
      </div>

      {isPending || !data ? (
        <p className="text-[13px] text-ink-faint">불러오는 중</p>
      ) : (
        <>
          <Margin summary={data} />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="전체 제작" value={`${data.totalJobs}건`} />
            <Stat label="유료" value={`${data.paidJobs}건`} />
            <Stat
              label="무료"
              value={`${data.freeJobs}건`}
              note={data.freeCost > 0 ? `원가 ${won(data.freeCost)}` : undefined}
              alert={data.freeCost > data.revenue && data.freeCost > 0}
            />
            <Stat
              label="실패"
              value={`${data.failedJobs}건`}
              note={data.failedJobs > 0 ? "전부 환불됨" : undefined}
            />
          </div>

          <Card
            title="무료 제작은 매출이 없어요"
            description="무료로 열어둔 템플릿은 사용자가 쓸 때마다 원가만 나가요. 사용자가 늘수록 이 숫자가 커집니다."
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <Line label="무료 제작 건수" value={`${data.freeJobs}건`} />
              <Line label="여기에 쓴 돈" value={won(data.freeCost)} alert={data.freeCost > 0} />
              <Line
                label="1건당"
                value={data.freeJobs > 0 ? won(Math.round(data.freeCost / data.freeJobs)) : "-"}
              />
            </div>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            <Stat label="가입자" value={`${data.totalUsers}명`} />
            <Stat label="템플릿" value={`${data.totalTemplates}개`} />
          </div>
        </>
      )}
    </div>
  );
}

/**
 * 남는 장사인지 한 줄로.
 *
 * 매출은 프롬비, 원가는 원이라 단위가 다르다. 그대로 빼면 안 된다. 프롬비를 원으로 환산해서
 * 비교한다 — 지금 시세는 1 프롬비 = 30원이다.
 */
const KRW_PER_CREDIT = 30;

function Margin({ summary }: { summary: OperationsSummary }) {
  const revenueKrw = summary.revenue * KRW_PER_CREDIT;
  const profit = revenueKrw - summary.providerCost;
  const losing = profit < 0;

  return (
    <div
      className={cn(
        "rounded-xl border p-5",
        losing ? "border-paid/50 bg-paid/8" : "border-line bg-surface",
      )}
    >
      <p className="text-[12px] text-ink-soft">{summary.days}일 동안</p>

      <p
        className={cn(
          "mt-1.5 font-mono text-[30px] font-semibold tracking-tight",
          losing ? "text-paid" : "text-accent",
        )}
      >
        {profit >= 0 ? "+" : ""}
        {won(profit)}
      </p>

      <p className="mt-2 text-[13px] text-ink-soft">
        매출 {won(revenueKrw)}
        <span className="text-ink-faint"> ({summary.revenue.toLocaleString()} 프롬비)</span>
        {" − "}
        AI 원가 {won(summary.providerCost)}
      </p>

      {losing && (
        <p className="mt-3 text-[13px] leading-relaxed text-paid">
          나간 돈이 들어온 돈보다 많아요. 무료 제작 비중이나 템플릿 요금을 조정해야 해요.
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  alert,
}: {
  label: string;
  value: string;
  note?: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4">
      <p className="text-[12px] text-ink-soft">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono text-[22px] font-semibold tracking-tight",
          alert ? "text-paid" : "text-ink",
        )}
      >
        {value}
      </p>
      {note && <p className="mt-1 text-[12px] text-ink-faint">{note}</p>}
    </div>
  );
}

function Line({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div>
      <p className="text-[12px] text-ink-soft">{label}</p>
      <p
        className={cn(
          "mt-1 font-mono text-[18px] font-semibold",
          alert ? "text-paid" : "text-ink",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function won(amount: number) {
  return `${amount.toLocaleString()}원`;
}
