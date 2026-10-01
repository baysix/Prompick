"use client";

import Link from "next/link";
import { cn } from "@/shared/lib/cn";

/**
 * 가입할 때 받는 동의.
 *
 * 필수와 선택을 한 덩어리로 묶지 않는다. "전체 동의" 하나만 두면 광고 수신까지 묶여
 * 들어가는데, 선택 항목은 따로 받아야 한다. 그래서 전체 동의는 편의로 두되 각 줄을
 * 그대로 보여주고, 필수가 아닌 줄에는 (선택)을 붙인다.
 *
 * 문서는 새 창으로 연다. 가입하다가 약관을 읽으러 갔다가 입력한 것이 사라지면,
 * 대부분은 읽지 않고 체크만 하게 된다.
 */
export type Consents = {
  terms: boolean;
  privacy: boolean;
  age14: boolean;
  marketing: boolean;
};

export const EMPTY_CONSENTS: Consents = {
  terms: false,
  privacy: false,
  age14: false,
  marketing: false,
};

/** 필수 항목이 모두 체크됐는가 */
export function requiredAgreed(c: Consents): boolean {
  return c.terms && c.privacy && c.age14;
}

export function ConsentFields({
  value,
  onChange,
}: {
  value: Consents;
  onChange: (next: Consents) => void;
}) {
  const all = value.terms && value.privacy && value.age14 && value.marketing;

  return (
    <div className="space-y-2.5 rounded-xl border border-line px-3.5 py-3">
      <Row
        checked={all}
        onChange={(next) =>
          onChange({ terms: next, privacy: next, age14: next, marketing: next })
        }
        bold
      >
        모두 동의합니다
      </Row>

      <div className="h-px bg-line" />

      <Row
        checked={value.age14}
        onChange={(next) => onChange({ ...value, age14: next })}
      >
        만 14세 이상입니다
      </Row>

      <Row checked={value.terms} onChange={(next) => onChange({ ...value, terms: next })}>
        <DocLink href="/terms">이용약관</DocLink>에 동의합니다
      </Row>

      <Row checked={value.privacy} onChange={(next) => onChange({ ...value, privacy: next })}>
        <DocLink href="/privacy">개인정보 수집·이용</DocLink>에 동의합니다
      </Row>

      <Row
        checked={value.marketing}
        onChange={(next) => onChange({ ...value, marketing: next })}
      >
        새 템플릿 소식을 받겠습니다 <span className="text-ink-faint">(선택)</span>
      </Row>
    </div>
  );
}

function Row({
  checked,
  onChange,
  bold,
  children,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  bold?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 accent-accent"
      />
      <span className={cn("text-[13px] leading-snug", bold ? "font-semibold text-ink" : "text-ink-soft")}>
        {children}
      </span>
    </label>
  );
}

/**
 * 약관 링크.
 *
 * 새 창으로 연다. 그리고 클릭이 체크박스까지 번지지 않게 막는다 — 읽으러 가려고 눌렀는데
 * 동의 처리가 되어버리면 읽지도 않고 동의한 기록이 남는다.
 */
function DocLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-accent underline underline-offset-2"
    >
      {children}
    </Link>
  );
}
