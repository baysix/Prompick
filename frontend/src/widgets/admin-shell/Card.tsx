import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * 관리 화면 조각들.
 *
 * 운영 화면은 하루에도 몇 번씩 같은 일을 하는 곳이라 화면마다 입력칸 모양이 다르면
 * 손이 매번 헤맨다. 그래서 여기 있는 것만 쓴다.
 */
export function Card({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-line bg-surface", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            {title && <h2 className="text-[15px] font-semibold text-ink">{title}</h2>}
            {description && (
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
        </header>
      )}
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

/** 입력칸 하나. 설명은 칸 아래에 둔다 — 위에 두면 이름과 설명이 뒤섞여 읽힌다 */
export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[13px] font-medium text-ink">
        {label}
        {required && <span className="ml-1 text-accent">*</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1.5 text-[12px] leading-relaxed text-ink-faint">{hint}</p>}
    </label>
  );
}

const CONTROL =
  "w-full rounded-lg border border-line bg-ground px-3 py-2 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-ink-faint";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(CONTROL, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(CONTROL, "min-h-24 leading-relaxed", className)} {...props} />;
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select className={cn(CONTROL, "appearance-none", className)} {...props}>
      {children}
    </select>
  );
}

/** 켬/끔. 체크박스보다 지금 상태가 한눈에 보인다 */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 text-[13px] text-ink"
    >
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-accent" : "bg-surface-2",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-[left]",
            checked ? "left-[18px]" : "left-0.5",
          )}
        />
      </span>
      {label}
    </button>
  );
}

/** 상태 표시. 색은 뜻이 있을 때만 쓴다 */
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "good" | "warn";
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-white/6 text-ink-soft",
    good: "bg-accent/15 text-accent",
    warn: "bg-paid/15 text-paid",
  } as const;

  return (
    <span
      className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", tones[tone])}
    >
      {children}
    </span>
  );
}
