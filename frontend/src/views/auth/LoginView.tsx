"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { api, ApiError } from "@/shared/api/client";
import { supabase } from "@/shared/auth/supabase";
import { SIGNUP_OPEN } from "@/shared/config/env";
import { Button } from "@/shared/ui/Button";

/**
 * 로그인과 가입.
 *
 * 가입은 우리 백엔드를 거친다 — 닉네임 중복 확인과 회원 저장을 함께 처리해야 하기 때문이다.
 * 로그인은 Supabase Auth에 직접 한다. 비밀번호가 우리 서버를 지나가지 않는다.
 */
export function LoginView() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/";

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (mode === "signup") {
        await api.post("/auth/signup", { email, password, nickname });
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        throw new Error(
          signInError.message.includes("Invalid login credentials")
            ? "이메일이나 비밀번호가 맞지 않아요."
            : signInError.message.includes("Email not confirmed")
              ? "메일 확인이 필요해요. 받은 편지함을 확인해주세요."
              : "로그인하지 못했어요.",
        );
      }

      router.replace(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex w-full flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-[26px] font-bold tracking-[-0.04em] text-ink">
          {mode === "signin" ? "다시 오셨네요" : "프롬픽 시작하기"}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
          {mode === "signin"
            ? "프롬프트를 받아 가거나 사진을 맡기려면 로그인이 필요해요."
            : "가입하면 무료 템플릿으로 바로 만들어 볼 수 있어요."}
        </p>

        <form onSubmit={submit} className="mt-7 space-y-3">
          {mode === "signup" && (
            <Field label="닉네임" value={nickname} onChange={setNickname} placeholder="2~20자" />
          )}
          <Field label="이메일" type="email" value={email} onChange={setEmail} required />
          <Field
            label="비밀번호"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={mode === "signup" ? "8자 이상" : undefined}
            required
          />

          {error && (
            <p className="rounded-xl bg-[#3a1d1d] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#ff9b9b]">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={busy} className="w-full">
            {busy ? "잠시만요" : mode === "signin" ? "로그인" : "가입하고 시작하기"}
          </Button>
        </form>

        {SIGNUP_OPEN && (
          <p className="mt-5 text-center text-[13px] text-ink-soft">
            {mode === "signin" ? "처음이신가요?" : "이미 계정이 있나요?"}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError(null);
              }}
              className="font-semibold text-accent"
            >
              {mode === "signin" ? "가입하기" : "로그인"}
            </button>
          </p>
        )}

        <p className="mt-10 text-center text-[12px] text-ink-faint">
          카카오·구글 로그인은 준비 중이에요.
        </p>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[12px] text-ink-soft">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl bg-surface px-3.5 py-3 text-[14px] text-ink outline-none placeholder:text-ink-faint"
      />
    </label>
  );
}
