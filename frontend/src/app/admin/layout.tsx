import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리자",
  // 관리자 화면은 검색에 노출되면 안 된다.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <>
      <header className="border-b border-line bg-ground-raised">
        <div className="mx-auto flex h-12 max-w-5xl items-center gap-4 px-4">
          <Link href="/admin/templates" className="text-[14px] font-semibold text-ink">
            프롬픽 관리자
          </Link>
          <nav className="flex items-center gap-3 text-[13px] text-ink-soft">
            <Link href="/admin/templates" className="hover:text-ink">
              템플릿
            </Link>
            <Link href="/admin/ai-models" className="hover:text-ink">
              AI 모델
            </Link>
          </nav>
          <Link href="/" className="ml-auto text-[13px] text-ink-soft hover:text-ink">
            서비스 화면으로
          </Link>
        </div>
      </header>
      {children}
    </>
  );
}
