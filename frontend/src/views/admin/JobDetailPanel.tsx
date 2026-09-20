"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import type { JobDetail } from "@/entities/admin/model/types";
import { ApiError } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Badge, Card, Input } from "@/widgets/admin-shell/Card";

/**
 * 제작 한 건의 전체 기록.
 *
 * "정말 실패한 게 맞나요?"에 답하는 화면이다. 세 가지를 나란히 놓는다 — 단계별로 무엇이
 * 어디서 깨졌는지, 프롬비가 어떻게 오갔는지, 이미 돌려준 적이 있는지.
 *
 * 마지막 항목이 가장 중요하다. 실패한 작업은 시스템이 자동으로 환불하는데, 운영자가 그 사실을
 * 모르고 한 번 더 주면 두 배가 나간다. 문의가 들어온 시점에는 이미 환불이 끝나 있는 경우가
 * 대부분이라, 이 화면이 그것부터 보여주지 않으면 이중 지급이 일상이 된다.
 */
export function JobDetailPanel({ jobId, onClose }: { jobId: number; onClose: () => void }) {
  const { data, isPending } = useQuery({
    queryKey: adminKeys.jobDetail(jobId),
    queryFn: () => adminApi.jobDetail(jobId),
  });

  if (isPending || !data) {
    return <Card title="불러오는 중">잠시만요</Card>;
  }

  return (
    <Card
      title={`#${data.id} ${data.templateTitle}`}
      description={`${data.nickname} · ${new Date(data.createdAt).toLocaleString("ko-KR")}`}
      actions={
        <Button size="sm" variant="ghost" onClick={onClose}>
          닫기
        </Button>
      }
    >
      <div className="space-y-5">
        <Verdict job={data} />

        <Section title="단계별 기록" hint="어디서 깨졌는지. 여기 적힌 원문은 사용자에게 안 보여요">
          {data.steps.length === 0 ? (
            <p className="text-[13px] text-ink-soft">아직 시작하지 않았어요.</p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {data.steps.map((step) => (
                <li key={step.index} className="px-3.5 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12px] text-ink-faint">{step.index + 1}단계</span>
                    <Badge
                      tone={
                        step.status === "SUCCEEDED"
                          ? "good"
                          : step.status === "FAILED"
                            ? "warn"
                            : "neutral"
                      }
                    >
                      {step.status === "SUCCEEDED"
                        ? "완료"
                        : step.status === "FAILED"
                          ? "실패"
                          : "진행"}
                    </Badge>
                    {step.startedAt && (
                      <span className="text-[11px] text-ink-faint">
                        {duration(step.startedAt, step.finishedAt)}
                      </span>
                    )}
                  </div>
                  {step.errorDetail && (
                    <p className="mt-1.5 break-all rounded bg-ground px-2.5 py-1.5 font-mono text-[11px] leading-relaxed text-paid">
                      {step.errorDetail}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="프롬비 흐름" hint="차감과 환불이 짝을 이루는지 보세요">
          {data.money.length === 0 ? (
            <p className="text-[13px] text-ink-soft">
              {data.chargeType === "FREE"
                ? "무료 제작이라 오간 프롬비가 없어요."
                : "이 작업에 기록된 프롬비 움직임이 없어요."}
            </p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {data.money.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center gap-3 px-3.5 py-2.5">
                  <span className="text-[13px] text-ink">{row.reasonLabel}</span>
                  {row.memo && <span className="text-[12px] text-ink-soft">{row.memo}</span>}
                  <span className="ml-auto text-right">
                    <span
                      className={cn(
                        "font-mono text-[14px] font-semibold",
                        row.amount > 0 ? "text-accent" : "text-ink-soft",
                      )}
                    >
                      {row.amount > 0 ? "+" : ""}
                      {row.amount}
                    </span>
                    <span className="ml-2 font-mono text-[11px] text-ink-faint">
                      남은 {row.balanceAfter}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <RefundBox job={data} />
      </div>
    </Card>
  );
}

/**
 * 한눈에 보는 판단 근거.
 *
 * 운영자가 스크롤하기 전에 답을 준다 — 실패가 맞는지, 이미 돌려줬는지.
 */
function Verdict({ job }: { job: JobDetail }) {
  const failed = job.status === "FAILED";

  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        job.alreadyRefunded
          ? "border-accent/40 bg-accent/8"
          : failed
            ? "border-paid/40 bg-paid/8"
            : "border-line bg-ground",
      )}
    >
      <p className="text-[15px] font-semibold text-ink">
        {job.alreadyRefunded
          ? "이미 돌려준 작업이에요"
          : failed
            ? "실패한 작업이에요"
            : job.status === "SUCCEEDED"
              ? "정상으로 끝난 작업이에요"
              : "아직 진행 중이에요"}
      </p>

      <dl className="mt-3 grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
        <Row label="결과물" value={`${job.outputCount}개`} />
        <Row
          label="받은 프롬비"
          value={job.chargeType === "FREE" ? "무료 제작" : `${job.creditCost}`}
        />
        <Row label="재시도" value={`${job.retryCount}회`} />
        <Row label="오류 코드" value={job.errorCode ?? "-"} />
      </dl>

      {job.alreadyRefunded && (
        <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">
          실패한 작업은 시스템이 자동으로 돌려줘요. 문의가 들어온 시점에는 이미 처리가 끝나 있는
          경우가 많아요. 아래 프롬비 흐름에서 환불 기록을 확인하세요.
        </p>
      )}
    </div>
  );
}

/** 직접 돌려주기. 사유 없이는 누를 수 없다 */
function RefundBox({ job }: { job: JobDetail }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refund = useMutation({
    mutationFn: () => adminApi.refundJob(job.id, reason.trim()),
    onSuccess: () => {
      setReason("");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "돌려주지 못했어요."),
  });

  return (
    <div className="rounded-lg bg-ground p-4">
      <p className="text-[13px] font-medium text-ink">직접 돌려주기</p>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-faint">{job.refundable.note}</p>

      {job.refundable.allowed ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="돌려주는 이유 (필수) — 사용자 문의 내용이나 판단 근거"
              className="min-w-0 flex-1"
            />
            <Button
              disabled={refund.isPending || reason.trim().length === 0}
              onClick={() => refund.mutate()}
            >
              {refund.isPending
                ? "처리 중"
                : job.chargeType === "FREE"
                  ? "무료 횟수 되돌리기"
                  : `${job.creditCost} 프롬비 돌려주기`}
            </Button>
          </div>
          {error && <p className="mt-2 text-[13px] text-paid">{error}</p>}
        </>
      ) : (
        <p className="mt-2 text-[13px] text-ink-soft">지금은 돌려줄 수 없어요.</p>
      )}
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[13px] font-medium text-ink">{title}</p>
      {hint && <p className="mb-2 mt-0.5 text-[12px] text-ink-faint">{hint}</p>}
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="font-mono text-ink">{value}</dd>
    </div>
  );
}

/** 얼마나 걸렸는지. 오래 걸린 단계가 대개 문제의 자리다 */
function duration(startedAt: string, finishedAt: string | null) {
  if (!finishedAt) return "진행 중";
  const seconds = Math.round(
    (new Date(finishedAt).getTime() - new Date(startedAt).getTime()) / 1000,
  );
  return `${seconds}초`;
}
