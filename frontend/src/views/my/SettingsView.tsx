"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api, ApiError } from "@/shared/api/client";
import { useSession, type Me } from "@/shared/auth/SessionProvider";
import { Button } from "@/shared/ui/Button";

/** 계정 설정. 지금 바꿀 수 있는 것과 아직 못 바꾸는 것을 솔직하게 나눠 보여준다 */
export function SettingsView() {
  const { me, signOut } = useSession();
  const queryClient = useQueryClient();
  const [nickname, setNickname] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const value = nickname ?? me?.nickname ?? "";

  const save = useMutation({
    mutationFn: () => api.patch<Me>("/me", { nickname: value }),
    onSuccess: () => {
      setError(null);
      setMessage("바꿨어요");
      setNickname(null);
      setTimeout(() => setMessage(null), 2000);
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => {
      setMessage(null);
      setError(e instanceof ApiError ? e.message : "바꾸지 못했어요.");
    },
  });

  return (
    <div className="max-w-lg space-y-8">
      <section>
        <h2 className="text-[15px] font-semibold text-ink">닉네임</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={value}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
            className="min-w-0 flex-1 rounded-xl bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none"
          />
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending || value.trim().length < 2}
          >
            {save.isPending ? "저장 중" : "저장"}
          </Button>
        </div>
        {message && <p className="mt-2 text-[13px] text-accent">{message}</p>}
        {error && <p className="mt-2 text-[13px] text-[#ff9b9b]">{error}</p>}
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">계정</h2>
        <dl className="mt-3 divide-y divide-line rounded-xl border border-line">
          <Row label="이메일" value={me?.email ?? "-"} />
          {/*
            인증을 끝낸 사람에게만 보여준다.

            인증하는 길이 아직 없어서, 안 한 사람에게 "아직 안 했어요"라고 적어두면 하라는
            말로 읽히는데 정작 누를 것이 없다. 무료 제작에도 더는 필요하지 않다.
            인증 수단이 붙으면 그때 안 한 사람에게도 보여준다.
          */}
          {me?.identityVerified && <Row label="휴대폰 인증" value="완료" />}
        </dl>
      </section>

      <section>
        <h2 className="text-[15px] font-semibold text-ink">그 밖에</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => void signOut()}>
            로그아웃
          </Button>
          <Button variant="ghost" disabled title="준비 중이에요">
            회원 탈퇴
          </Button>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
      <dt className="text-[13px] text-ink-soft">{label}</dt>
      <dd className="ml-auto text-right">
        <p className="text-[14px] text-ink">{value}</p>
        {hint && <p className="mt-0.5 text-[12px] text-ink-faint">{hint}</p>}
      </dd>
    </div>
  );
}
