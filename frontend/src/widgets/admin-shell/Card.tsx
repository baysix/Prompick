import type { ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

/** 관리자 화면의 기본 상자. 같은 종류의 정보가 같은 모양으로 보이게 한다. */
export function Card({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-line bg-surface", className)}>
      {(title || action) && (
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
          <div>
            {title && <h2 className="text-[14px] font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[12px] text-ink-soft">{description}</p>}
          </div>
          {action && <div className="ml-auto">{action}</div>}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

/** 숫자 하나를 크게 보여주는 타일 */
export function StatTile({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-5 py-4">
      <p className="text-[12px] text-ink-soft">{label}</p>
      <p className="mt-1.5 text-[26px] font-semibold leading-none tracking-tight text-ink">
        {typeof value === "number" ? value.toLocaleString() : value}
        {unit && <span className="ml-1 text-[13px] font-normal text-ink-soft">{unit}</span>}
      </p>
      {hint && <p className="mt-1.5 text-[11px] text-ink-faint">{hint}</p>}
    </div>
  );
}
