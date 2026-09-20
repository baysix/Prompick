"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import type { AdminUserSummary, CreditEntry } from "@/entities/admin/model/types";
import { ApiError } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Badge, Card, Input } from "@/widgets/admin-shell/Card";

/**
 * 사용자 관리.
 *
 * 돈이 오가는 서비스에서 운영자가 반드시 할 수 있어야 하는 일은 셋이다 — 누가 쓰는지 보고,
 * 문제가 생긴 계정을 멈추고, 잘못된 차감을 되돌리는 것. 이게 없으면 문의에 아무것도 해줄 수 없다.
 *
 * 프롬비를 넣고 빼는 일은 전부 사유를 적게 한다. 적지 않고 고칠 수 있으면 그 숫자는 곧 신뢰를
 * 잃는다 — 나중에 누가 왜 바꿨는지 아무도 모르게 되기 때문이다.
 */
export function AdminUserList() {
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState<number | null>(null);

  const { data, isPending } = useQuery({
    queryKey: adminKeys.users(keyword),
    queryFn: () => adminApi.users(keyword || undefined),
  });

  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <Input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="닉네임이나 이메일로 찾기"
        className="max-w-xs"
      />

      {isPending ? (
        <p className="text-[13px] text-ink-faint">불러오는 중</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-line py-16 text-center text-[13px] text-ink-soft">
          찾는 사용자가 없어요.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-surface text-[12px] text-ink-soft">
                <Th className="w-full">사용자</Th>
                <Th className="text-right">프롬비</Th>
                <Th>본인인증</Th>
                <Th>상태</Th>
                <Th>가입</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => (
                <Row key={user.id} user={user} onOpen={() => setSelected(user.id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected !== null && <UserPanel userId={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function Row({ user, onOpen }: { user: AdminUserSummary; onOpen: () => void }) {
  const queryClient = useQueryClient();

  const toggle = useMutation({
    mutationFn: () =>
      adminApi.changeUserStatus(user.id, user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminKeys.all }),
  });

  return (
    <tr className="border-b border-line last:border-0 hover:bg-white/3">
      <Td>
        <p className="text-[14px] font-medium text-ink">
          {user.nickname}
          {user.role === "ADMIN" && (
            <span className="ml-2">
              <Badge tone="good">운영자</Badge>
            </span>
          )}
        </p>
        <p className="mt-0.5 text-[12px] text-ink-faint">{user.email ?? "-"}</p>
      </Td>

      <Td className="text-right font-mono text-[13px] text-ink">
        {user.creditBalance.toLocaleString()}
      </Td>

      <Td className="text-[13px] text-ink-soft">{user.identityVerified ? "완료" : "-"}</Td>

      <Td>
        <Badge tone={user.status === "ACTIVE" ? "good" : "warn"}>
          {user.status === "ACTIVE" ? "정상" : user.status === "SUSPENDED" ? "정지" : "탈퇴"}
        </Badge>
      </Td>

      <Td className="whitespace-nowrap text-[12px] text-ink-faint">
        {new Date(user.createdAt).toLocaleDateString("ko-KR", {
          year: "2-digit",
          month: "numeric",
          day: "numeric",
        })}
      </Td>

      <Td className="whitespace-nowrap">
        <div className="flex gap-1.5">
          <Button size="sm" variant="secondary" onClick={onOpen}>
            내역
          </Button>
          {user.status !== "WITHDRAWN" && (
            <Button
              size="sm"
              variant="ghost"
              disabled={toggle.isPending}
              onClick={() => toggle.mutate()}
            >
              {user.status === "ACTIVE" ? "정지" : "해제"}
            </Button>
          )}
        </div>
      </Td>
    </tr>
  );
}

/** 한 사람의 지갑과 거래 장부 */
function UserPanel({ userId, onClose }: { userId: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: adminKeys.user(userId),
    queryFn: () => adminApi.user(userId),
  });

  const adjust = useMutation({
    mutationFn: (value: number) =>
      adminApi.adjustCredits(userId, { amount: value, memo: memo.trim() || null }),
    onSuccess: () => {
      setAmount("");
      setMemo("");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : "처리하지 못했어요. 값을 확인해주세요."),
  });

  const value = Number(amount || 0);
  const canSubmit = value !== 0 && memo.trim().length > 0 && !adjust.isPending;

  return (
    <Card
      title={isPending ? "불러오는 중" : `${data?.user.nickname} 님`}
      description={
        data ? `잔액 ${data.user.creditBalance.toLocaleString()} 프롬비` : undefined
      }
      actions={
        <Button size="sm" variant="ghost" onClick={onClose}>
          닫기
        </Button>
      }
    >
      {data && (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Figure label="현재 잔액" value={data.user.creditBalance} />
            <Figure label="누적 받은 것" value={data.totalCharged} />
            <Figure label="누적 쓴 것" value={data.totalSpent} />
          </div>

          <div className="rounded-lg bg-ground p-4">
            <p className="text-[13px] font-medium text-ink">프롬비 지급·회수</p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-faint">
              양수는 지급, 음수는 회수예요. 사유는 반드시 남겨야 해요 — 나중에 이 기록만으로
              무슨 일이었는지 알 수 있어야 합니다.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9-]/g, ""))}
                inputMode="numeric"
                placeholder="예: 100 또는 -50"
                className="w-40 font-mono"
              />
              <Input
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="사유 (필수)"
                className="min-w-0 flex-1"
              />
              <Button disabled={!canSubmit} onClick={() => adjust.mutate(value)}>
                {adjust.isPending ? "처리 중" : value < 0 ? "회수" : "지급"}
              </Button>
            </div>

            {error && <p className="mt-2 text-[13px] text-paid">{error}</p>}
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-ink">프롬비 내역</p>
            {data.credits.length === 0 ? (
              <p className="rounded-lg border border-line py-8 text-center text-[13px] text-ink-soft">
                아직 오간 내역이 없어요.
              </p>
            ) : (
              <ul className="divide-y divide-line rounded-lg border border-line">
                {data.credits.map((entry) => (
                  <Entry key={entry.id} entry={entry} />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function Entry({ entry }: { entry: CreditEntry }) {
  const incoming = entry.amount > 0;

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-ink">
          {entry.reasonLabel}
          {entry.refId && (
            <span className="ml-1.5 font-mono text-[11px] text-ink-faint">
              #{entry.refId}
            </span>
          )}
        </p>
        {entry.memo && <p className="mt-0.5 text-[12px] text-ink-soft">{entry.memo}</p>}
        <p className="mt-0.5 text-[11px] text-ink-faint">
          {new Date(entry.createdAt).toLocaleString("ko-KR", {
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {entry.actor && ` · ${entry.actor}`}
        </p>
      </div>

      <div className="text-right">
        <p
          className={cn(
            "font-mono text-[14px] font-semibold",
            incoming ? "text-accent" : "text-ink-soft",
          )}
        >
          {incoming ? "+" : ""}
          {entry.amount.toLocaleString()}
        </p>
        <p className="font-mono text-[11px] text-ink-faint">
          남은 {entry.balanceAfter.toLocaleString()}
        </p>
      </div>
    </li>
  );
}

function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[12px] text-ink-soft">{label}</p>
      <p className="mt-1 font-mono text-[20px] font-semibold text-ink">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-2.5 font-medium whitespace-nowrap", className)}>{children}</th>;
}

function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-middle", className)}>{children}</td>;
}
