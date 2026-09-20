"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import type { AdminNotice, NoticeForm } from "@/entities/admin/model/types";
import { Button } from "@/shared/ui/Button";
import { Badge, Card, Field, Input, Textarea, Toggle } from "@/widgets/admin-shell/Card";

/**
 * 공지 관리.
 *
 * 쓰는 것과 내보내는 것을 나눠 둔다. 점검 공지는 시각이 중요해서 미리 써 두고 때가 되었을 때
 * 내보내야 하는데, 저장이 곧 공개라면 그럴 수 없다. 그래서 새로 만든 공지는 항상 작성 중이다.
 */
const EMPTY: NoticeForm = { title: "", body: "", pinned: false };

export function AdminNoticeList() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<AdminNotice | null>(null);
  const [form, setForm] = useState<NoticeForm>(EMPTY);
  const [writing, setWriting] = useState(false);

  const { data: notices, isPending } = useQuery({
    queryKey: adminKeys.notices(),
    queryFn: () => adminApi.notices(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: adminKeys.notices() });

  const save = useMutation({
    mutationFn: () =>
      editing ? adminApi.updateNotice(editing.id, form) : adminApi.createNotice(form),
    onSuccess: () => {
      close();
      void refresh();
    },
  });

  function open(notice: AdminNotice | null) {
    setEditing(notice);
    setForm(notice ? { title: notice.title, body: notice.body, pinned: notice.pinned } : EMPTY);
    setWriting(true);
    save.reset();
  }

  function close() {
    setWriting(false);
    setEditing(null);
    setForm(EMPTY);
  }

  return (
    <div className="space-y-4">
      {writing ? (
        <Card
          title={editing ? "공지 고치기" : "공지 쓰기"}
          description={
            editing
              ? undefined
              : "저장하면 작성 중 상태예요. 내보내기를 눌러야 사용자에게 보여요."
          }
        >
          <div className="space-y-3">
            <Field label="제목">
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="무슨 일인지 한 줄로"
              />
            </Field>

            <Field label="내용">
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={8}
                placeholder="언제부터 언제까지, 무엇이 어떻게 되는지"
              />
            </Field>

            <Toggle
              checked={form.pinned}
              onChange={(pinned) => setForm({ ...form, pinned })}
              label="위에 고정"
            />

            {save.isError && (
              <p className="text-[13px] text-paid">{save.error.message}</p>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={save.isPending || !form.title.trim() || !form.body.trim()}
                onClick={() => save.mutate()}
              >
                {save.isPending ? "저장 중" : "저장"}
              </Button>
              <Button size="sm" variant="ghost" onClick={close}>
                취소
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button size="sm" onClick={() => open(null)}>
          공지 쓰기
        </Button>
      )}

      {isPending ? (
        <p className="py-16 text-center text-[13px] text-ink-faint">불러오는 중</p>
      ) : !notices || notices.length === 0 ? (
        <p className="py-16 text-center text-[13px] text-ink-faint">아직 쓴 공지가 없어요.</p>
      ) : (
        <div className="space-y-2.5">
          {notices.map((notice) => (
            <Row key={notice.id} notice={notice} onEdit={() => open(notice)} onDone={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  notice,
  onEdit,
  onDone,
}: {
  notice: AdminNotice;
  onEdit: () => void;
  onDone: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const toggle = useMutation({
    mutationFn: () =>
      notice.published ? adminApi.unpublishNotice(notice.id) : adminApi.publishNotice(notice.id),
    onSuccess: onDone,
  });

  const remove = useMutation({
    mutationFn: () => adminApi.deleteNotice(notice.id),
    onSuccess: onDone,
  });

  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-[15px] font-semibold text-ink">{notice.title}</h3>
            {notice.pinned && <Badge>고정</Badge>}
            <Badge tone={notice.published ? "good" : "warn"}>
              {notice.published ? "공개 중" : "작성 중"}
            </Badge>
          </div>
          <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed whitespace-pre-wrap text-ink-soft">
            {notice.body}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button size="sm" variant="secondary" onClick={onEdit}>
            고치기
          </Button>
          <Button size="sm" disabled={toggle.isPending} onClick={() => toggle.mutate()}>
            {toggle.isPending ? "…" : notice.published ? "내리기" : "내보내기"}
          </Button>

          {confirming ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                className="text-paid"
                disabled={remove.isPending}
                onClick={() => remove.mutate()}
              >
                {remove.isPending ? "…" : "정말 지울까요"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                취소
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="text-ink-faint hover:text-paid"
              onClick={() => setConfirming(true)}
            >
              삭제
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
