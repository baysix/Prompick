import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/**
 * 버튼.
 *
 * 세 가지만 둔다. 주요 행동은 라임, 그 옆의 행동은 반투명 흰색, 나머지는 글자만.
 * 종류를 늘리면 어느 것을 쓸지 매번 고민하게 되고, 화면마다 다른 버튼이 생긴다.
 */
type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:brightness-105",
  secondary: "bg-white/8 text-ink hover:bg-white/12",
  ghost: "text-ink-soft hover:text-ink hover:bg-white/5",
};

const SIZES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-[13px] rounded-lg",
  md: "px-4 py-2.5 text-[14px] rounded-lg",
  lg: "px-6 py-3.5 text-[15px] rounded-xl",
};

function classesFor(variant: Variant, size: Size, className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-1.5 font-semibold transition-colors",
    "disabled:opacity-40 disabled:pointer-events-none",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button className={classesFor(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={classesFor(variant, size, className)}>
      {children}
    </Link>
  );
}

/** 오른쪽 위로 향하는 화살표. "여기서 나간다"는 뜻으로만 쓴다 */
export function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={cn("h-3 w-3", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d="M3 9 9 3M4.5 3H9v4.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
