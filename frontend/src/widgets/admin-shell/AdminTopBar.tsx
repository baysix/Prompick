import type { ReactNode } from "react";

/** 관리 화면 머리말. 지금 어디에 있는지와 여기서 할 수 있는 일만 둔다 */
export function AdminTopBar({ title, actions }: { title: string; actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-ground/90 px-5 backdrop-blur-xl">
      <h1 className="text-[16px] font-semibold text-ink">{title}</h1>
      {actions && <div className="ml-auto flex gap-2">{actions}</div>}
    </header>
  );
}
