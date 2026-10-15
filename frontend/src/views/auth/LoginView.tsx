"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { legalApi, legalKeys } from "@/entities/legal/api/legalApi";
import { api, ApiError } from "@/shared/api/client";
import { supabase } from "@/shared/auth/supabase";
import { SIGNUP_OPEN } from "@/shared/config/env";
import { Button } from "@/shared/ui/Button";
import {
  ConsentFields,
  EMPTY_CONSENTS,
  requiredAgreed,
  type Consents,
} from "./ConsentFields";

/**
 * 로그인과 가입.
 *
 * 가입은 우리 백엔드를 거친다 — 닉네임 중복 확인과 회원 저장을 함께 처리해야 하기 때문이다.
 * 로그인은 Supabase Auth에 직접 한다. 비밀번호가 우리 서버를 지나가지 않는다.
 */
export function LoginView() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";

  // ?mode=signup 으로 들어오면 가입 화면으로 연다. 헤더의 가입 버튼이 이 주소를 쓴다.
  // 가입이 닫혀 있으면 무시한다 - 주소를 아는 사람에게만 열리는 문이 되어서는 안 된다.
  const [mode, setMode] = useState<"signin" | "signup">(
    SIGNUP_OPEN && params.get("mode") === "signup" ? "signup" : "signin",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [consents, setConsents] = useState<Consents>(EMPTY_CONSENTS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // 사용자가 본 문서의 버전. 가입할 때 그대로 돌려보내면 서버가 지금 버전과 맞는지 본다.
  const { data: legal } = useQuery({
    queryKey: legalKeys.versions(),
    queryFn: () => legalApi.versions(),
    enabled: mode === "signup",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (mode === "signup") {
        if (!legal) {
          throw new Error("약관을 불러오지 못했어요. 잠시 후 다시 시도해주세요.");
        }
        await api.post("/auth/signup", {
          email,
          password,
          nickname,
          agreeTerms: consents.terms,
          agreePrivacy: consents.privacy,
          agreeAge14: consents.age14,
          agreeMarketing: consents.marketing,
          termsVersion: legal.termsVersion,
          privacyVersion: legal.privacyVersion,
        });
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
      setError(messageOf(err));
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
            <Field
              label="닉네임"
              value={nickname}
              onChange={setNickname}
              placeholder="2~20자"
              required
              minLength={2}
              maxLength={20}
            />
          )}
          <Field label="이메일" type="email" value={email} onChange={setEmail} required />
          <Field
            label="비밀번호"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={mode === "signup" ? "8자 이상" : undefined}
            required
            minLength={mode === "signup" ? 8 : undefined}
          />

          {mode === "signup" && (
            <div className="pt-1">
              <ConsentFields value={consents} onChange={setConsents} />
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-[#3a1d1d] px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line text-[#ff9b9b]">
              {error}
            </p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={busy || (mode === "signup" && !requiredAgreed(consents))}
            className="w-full"
          >
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

/**
 * 사용자에게 보여줄 한 줄을 고른다.
 *
 * 서버는 입력이 규칙에 안 맞으면 "요청 값이 올바르지 않아요"라는 뭉뚱그린 말과 함께,
 * errors 에 어느 칸이 왜 틀렸는지를 담아 보낸다. 그런데 화면이 앞엣것만 보여주고 있었다.
 * 닉네임이 한 글자여서 막힌 사람에게 "요청 값이 올바르지 않아요"는 아무것도 알려주지 않고,
 * 어디를 고쳐야 할지 모르니 같은 입력으로 몇 번이고 다시 누르게 된다.
 *
 * 그래서 칸별 이유가 있으면 그것을 보여준다. 여러 개면 줄을 나눠 전부 보여준다 - 하나만
 * 고치고 다시 눌렀다가 또 막히는 것이 더 나쁘다.
 */
function messageOf(err: unknown): string {
  if (err instanceof ApiError) {
    const fields = err.fieldErrors ?? [];
    return fields.length > 0 ? fields.map((f) => f.message).join("\n") : err.message;
  }
  return (err as Error).message;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  minLength,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  minLength?: number;
  maxLength?: number;
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
        minLength={minLength}
        maxLength={maxLength}
        className="w-full rounded-xl bg-surface px-3.5 py-3 text-[14px] text-ink outline-none placeholder:text-ink-faint"
      />
    </label>
  );
}
