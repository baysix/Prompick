import Link from "next/link";
import { SERVICE } from "@/shared/config/env";
import { UserMenu } from "./UserMenu";

/**
 * 상단바.
 *
 * 비로그인도 모든 화면을 볼 수 있으므로 로그인 버튼은 조용히 둔다.
 * 실제로 막는 지점은 프롬프트 열람과 제작 버튼이다.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ground/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="text-[15px] font-semibold tracking-tight text-ink">
          {SERVICE.name}
        </Link>

        <nav className="flex items-center gap-4 text-[13px] text-ink-soft">
          <Link href="/explore" className="hover:text-ink">
            탐색
          </Link>
          <Link href="/explore?promptOnly=true" className="hover:text-ink">
            프롬프트
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/search"
            className="text-[13px] text-ink-soft hover:text-ink"
            aria-label="검색"
          >
            검색
          </Link>
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
