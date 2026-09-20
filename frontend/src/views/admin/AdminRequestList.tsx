"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import type { AdminRequestRow } from "@/entities/admin/model/types";
import { ApiError } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Badge, Card, Select, Textarea } from "@/widgets/admin-shell/Card";

/**
 * 요청 관리.
 *
 * 운영자에게 이 화면은 "다음에 무엇을 만들까"의 답이다. 추천 많은 순으로 보면 사람들이 실제로
 * 기다리는 것이 위로 올라온다.
 *
 * 상태를 바꿀 때 완성이면 템플릿을, 반려면 이유를 받는다. 아무 말 없이 닫히는 요청이 쌓이면
 * 다음부터 아무도 올리지 않는다.
 */
const TABS: { label: string; status?: string }[] = [
  { label: "전체" },
  { label: "접수됨", status: "PENDING" },
  { label: "살펴보는 중", status: "REVIEWING" },
  { label: "만드는 중", status: "BUILDING" },
  { label: "완성", status: "DONE" },
  { label: "어려워요", status: "REJECTED" },
];

export function AdminRequestList() {
  const [tab, setTab] = useState(0);
  const status = TABS[tab].status;

  const { data, isPending } = useQuery({
    queryKey: adminKeys.requests(status),
    queryFn: () => adminApi.requests(status),
  });

  const rows = data ?? [];

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex flex-wrap gap-1">
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
          해당하는 요청이 없어요.
        </p>
      ) : (
        rows.map((row) => <RequestCard key={row.id} row={row} />)
      )}
    </div>
  );
}

function RequestCard({ row }: { row: AdminRequestRow }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState(row.status);
  const [templateId, setTemplateId] = useState<string>(row.templateId?.toString() ?? "");
  const [note, setNote] = useState(row.adminNote ?? "");
  const [error, setError] = useState<string | null>(null);

  const { data: options } = useQuery({
    queryKey: adminKeys.requestTemplates(),
    queryFn: adminApi.requestTemplateOptions,
    enabled: editing,
  });

  const save = useMutation({
    mutationFn: () =>
      adminApi.changeRequestStatus(row.id, {
        status,
        templateId: templateId ? Number(templateId) : null,
        adminNote: note.trim() || null,
      }),
    onSuccess: () => {
      setEditing(false);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : "바꾸지 못했어요."),
  });

  const needsTemplate = status === "DONE";
  const needsNote = status === "REJECTED";
  const canSave =
    !save.isPending && (!needsTemplate || templateId !== "") && (!needsNote || note.trim() !== "");

  return (
    <Card>
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-line">
          <span aria-hidden className="text-[11px] leading-none text-ink-faint">
            ▲
          </span>
          <span className="mt-1 font-mono text-[15px] font-semibold leading-none text-ink">
            {row.voteCount}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              tone={
                row.status === "DONE" ? "good" : row.status === "REJECTED" ? "neutral" : "warn"
              }
            >
              {row.statusLabel}
            </Badge>
            <p className="text-[15px] font-semibold text-ink">{row.title}</p>
          </div>

          {row.description && (
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{row.description}</p>
          )}

          {row.referenceUrl && (
            <a
              href={row.referenceUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="mt-2 inline-block max-w-full truncate text-[12px] text-accent hover:underline"
            >
              {row.referenceUrl}
            </a>
          )}

          {row.adminNote && !editing && (
            <p className="mt-2.5 rounded-lg bg-ground px-3 py-2 text-[12px] leading-relaxed text-ink-soft">
              {row.adminNote}
            </p>
          )}

          <p className="mt-2.5 text-[11px] text-ink-faint">
            {row.authorNickname} ·{" "}
            {new Date(row.createdAt).toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
            })}
            {row.templateSlug && ` · /t/${row.templateSlug}`}
          </p>
        </div>

        {!editing && (
          <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
            상태 바꾸기
          </Button>
        )}
      </div>

      {editing && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <div className="flex flex-wrap gap-2">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as AdminRequestRow["status"])}
              className="w-44"
              aria-label="진행 상태"
            >
              <option value="PENDING">접수됨</option>
              <option value="REVIEWING">살펴보는 중</option>
              <option value="BUILDING">만드는 중</option>
              <option value="DONE">완성</option>
              <option value="REJECTED">어려워요</option>
            </Select>

            {needsTemplate && (
              <Select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="min-w-0 flex-1"
                aria-label="만들어진 템플릿"
              >
                <option value="">만들어진 템플릿 고르기</option>
                {(options ?? []).map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.title}
                  </option>
                ))}
              </Select>
            )}
          </div>

          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder={
              needsNote
                ? "왜 어려운지 적어주세요 (필수). 올린 사람이 이 글을 봅니다"
                : "올린 사람에게 남길 말 (선택)"
            }
          />

          <p className="text-[12px] leading-relaxed text-ink-faint">
            여기 적은 글은 요청 게시판에 그대로 보여요. 아무 말 없이 닫힌 요청이 쌓이면 다음부터
            아무도 올리지 않아요.
          </p>

          {error && <p className="text-[13px] text-paid">{error}</p>}

          <div className="flex gap-2">
            <Button size="sm" disabled={!canSave} onClick={() => save.mutate()}>
              {save.isPending ? "저장 중" : "저장"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              취소
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
