import { cn } from "@/shared/lib/cn";
import type { GenerateAccess, PromptAccess } from "../model/types";

/**
 * 요금 배지.
 *
 * 화면에서 색을 갖는 유일한 요소다. 초록은 무료, 황동은 유료.
 * 프롬프트 비공개는 색을 하나 더 쓰지 않고 형태(자물쇠)로 구분한다.
 */

const base =
  "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium leading-none";

export function GenerateBadge({
  access,
  cost,
  className,
}: {
  access: GenerateAccess;
  cost: number;
  className?: string;
}) {
  if (access === "FREE") {
    return (
      <span className={cn(base, "bg-free-soft text-free", className)}>무료로 제작</span>
    );
  }
  return (
    <span className={cn(base, "bg-paid-soft text-paid", className)}>
      <span aria-hidden>🪙</span>
      {cost.toLocaleString()}
    </span>
  );
}

export function PromptBadge({
  access,
  cost,
  className,
}: {
  access: PromptAccess;
  cost: number;
  className?: string;
}) {
  if (access === "HIDDEN") {
    return (
      <span className={cn(base, "border border-line text-ink-faint", className)}>
        <LockIcon />
        프롬프트 비공개
      </span>
    );
  }
  if (access === "FREE") {
    return (
      <span className={cn(base, "bg-free-soft text-free", className)}>프롬프트 공개</span>
    );
  }
  return (
    <span className={cn(base, "bg-paid-soft text-paid", className)}>
      프롬프트 <span aria-hidden>🪙</span>
      {cost.toLocaleString()}
    </span>
  );
}

export function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={cn("h-3 w-3", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden
    >
      <rect x="2.5" y="5.5" width="7" height="5" rx="1" />
      <path d="M4.2 5.5V4a1.8 1.8 0 0 1 3.6 0v1.5" />
    </svg>
  );
}
