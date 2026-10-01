import Link from "next/link";
import type { ReactNode } from "react";

/**
 * 가이드 본문의 조판.
 *
 * 글을 읽히려고 만든 화면이라 본문 폭을 좁게 잡고 줄 간격을 넉넉히 둔다. 결과물 격자와
 * 같은 폭으로 늘어놓으면 한 줄이 너무 길어져서 눈이 다음 줄을 찾지 못한다.
 */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 first:mt-0">
      <h2 className="text-[19px] font-bold leading-snug tracking-[-0.03em] text-ink">{title}</h2>
      <div className="mt-3 space-y-3.5 text-[15px] leading-[1.75] text-ink-soft">{children}</div>
    </section>
  );
}

export function Items({ children }: { children: ReactNode }) {
  return (
    <ul className="ml-4 list-disc space-y-2 marker:text-ink-faint">{children}</ul>
  );
}

/** 강조해서 떼어두는 한 문단. 꼭 기억했으면 하는 것에만 쓴다 */
export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-xl border border-line bg-surface px-4 py-3.5 text-[14px] leading-relaxed text-ink">
      {children}
    </p>
  );
}

/** 좋은 예와 나쁜 예를 나란히 */
export function Compare({ good, bad }: { good: string[]; bad: string[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-xl border border-accent/30 bg-accent/8 px-4 py-3.5">
        <p className="text-[13px] font-semibold text-accent">이렇게 하면 잘 나와요</p>
        <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ink-soft">
          {good.map((t) => (
            <li key={t}>· {t}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-line bg-surface px-4 py-3.5">
        <p className="text-[13px] font-semibold text-ink-soft">이런 사진은 아쉬워요</p>
        <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ink-faint">
          {bad.map((t) => (
            <li key={t}>· {t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** 글 끝에서 다음 할 일로 보낸다. 다 읽고 나갈 곳이 없으면 그냥 닫는다 */
export function NextStep({ href, label, children }: { href: string; label: string; children: ReactNode }) {
  return (
    <div className="mt-12 rounded-2xl border border-line px-5 py-5">
      <p className="text-[14px] leading-relaxed text-ink-soft">{children}</p>
      <Link
        href={href}
        className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-[14px] font-semibold text-accent-ink"
      >
        {label} <span aria-hidden>↗</span>
      </Link>
    </div>
  );
}
