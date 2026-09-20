"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import type { AdminBugReport, BugReportStatus } from "@/entities/admin/model/types";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Badge, Select, Textarea } from "@/widgets/admin-shell/Card";

/**
 * 오류 신고 관리.
 *
 * 신고 하나를 읽고 판단하는 데 필요한 것이 한 자리에 있어야 한다 — 무엇을 하다 그랬는지,
 * 어느 화면이었는지, 어떤 브라우저였는지. 셋 중 하나라도 빠지면 재현하려고 되묻게 되고,
 * 되묻는 사이 신고한 사람은 떠난다.
 *
 * 기본으로 아직 끝나지 않은 것만 보여준다. 고친 신고까지 섞이면 목록이 금세 과거로 덮인다.
 */
const FILTERS: { label: string; status?: BugReportStatus }[] = [
  { label: "접수됨", status: "OPEN" },
  { label: "확인됨", status: "CONFIRMED" },
  { label: "고쳤어요", status: "FIXED" },
  { label: "전체" },
];

const STATUS_OPTIONS: { value: BugReportStatus; label: string }[] = [
  { value: "OPEN", label: "접수됨" },
  { value: "CONFIRMED", label: "확인됨 — 고쳐야 할 문제가 맞다" },
  { value: "FIXED", label: "고쳤어요" },
  { value: "NOT_A_BUG", label: "오류가 아니에요" },
  { value: "DUPLICATE", label: "이미 들어온 신고" },
];

export function AdminBugReportList() {
  const [tab, setTab] = useState(0);
  const status = FILTERS[tab].status;

  const { data, isPending } = useQuery({
    queryKey: adminKeys.bugReports(status),
    queryFn: () => adminApi.bugReports(status),
  });

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-1.5">
        {FILTERS.map((f, i) => (
          <button
            key={f.label}
            type="button"
            onClick={() => setTab(i)}
            className={cn(
              "rounded-lg px-3.5 py-1.5 text-[13px] transition-colors",
              i === tab ? "bg-white/10 font-semibold text-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <p className="py-16 text-center text-[13px] text-ink-faint">불러오는 중</p>
      ) : !data || data.length === 0 ? (
        <p className="py-16 text-center text-[13px] text-ink-faint">
          {status === "OPEN" ? "처리할 신고가 없어요." : "신고가 없어요."}
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report }: { report: AdminBugReport }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<BugReportStatus>(report.status);
  const [note, setNote] = useState(report.adminNote ?? "");

  const resolve = useMutation({
    mutationFn: () => adminApi.resolveBugReport(report.id, status, note),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [...adminKeys.all, "bug-reports"] }),
  });

  // 이렇게 닫으려면 이유가 필요하다. 서버도 막지만, 눌러본 뒤에 거절당하는 것보다
  // 버튼이 비활성인 편이 무엇을 해야 하는지 빨리 알려준다.
  const needsReason = status === "NOT_A_BUG" || status === "DUPLICATE";
  const blocked = needsReason && note.trim() === "";

  const done = report.status === "FIXED" || report.status === "NOT_A_BUG" || report.status === "DUPLICATE";

  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[12px] text-ink-faint">#{report.id}</span>
        <h3 className="text-[15px] font-semibold text-ink">{report.title}</h3>
        <Badge tone={done ? "neutral" : "warn"}>{report.statusLabel}</Badge>
        <span className="ml-auto text-[12px] text-ink-faint">
          {report.nickname} · {new Date(report.createdAt).toLocaleString("ko-KR")}
        </span>
      </div>

      <p className="mt-3 text-[13px] leading-relaxed whitespace-pre-wrap text-ink">{report.body}</p>

      <dl className="mt-3 space-y-1 border-t border-line pt-3 text-[12px]">
        {report.pageUrl && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-ink-faint">화면</dt>
            <dd className="min-w-0 break-all font-mono text-ink-soft">{report.pageUrl}</dd>
          </div>
        )}
        {report.userAgent && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-ink-faint">브라우저</dt>
            <dd className="min-w-0 break-all font-mono text-ink-soft">{report.userAgent}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4 space-y-2 border-t border-line pt-4">
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder={
            needsReason
              ? "왜 그렇게 판단했는지 적어주세요. 신고한 사람이 읽어요."
              : "무엇을 고쳤는지 (신고한 사람이 읽어요)"
          }
        />

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value as BugReportStatus)}
            className="w-auto"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>

          <Button size="sm" disabled={resolve.isPending || blocked} onClick={() => resolve.mutate()}>
            {resolve.isPending ? "저장 중" : "저장"}
          </Button>

          {blocked && <span className="text-[12px] text-paid">이유를 적어주세요</span>}
          {resolve.isError && (
            <span className="text-[12px] text-paid">{resolve.error.message}</span>
          )}
        </div>
      </div>
    </div>
  );
}
