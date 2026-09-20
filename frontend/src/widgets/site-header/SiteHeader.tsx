"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useSession } from "@/shared/auth/SessionProvider";
import { SIGNUP_OPEN } from "@/shared/config/env";
import { cn } from "@/shared/lib/cn";
import { ButtonLink } from "@/shared/ui/Button";

/**
 * 상단바.
 *
 * 로고는 왼쪽, 메뉴는 한가운데, 계정은 오른쪽. 메뉴를 가운데 두면 왼쪽 로고와 오른쪽
 * 계정 영역의 폭이 달라져도 메뉴 위치가 흔들리지 않아, 화면을 옮겨 다녀도 같은 자리에서
 * 같은 것을 찾게 된다.
 *
 * 메뉴에는 네모난 배경을 두지 않는다. 글자만 두어야 상단바가 조용해지고, 화면의 주인공인
 * 결과물이 먼저 보인다. 지금 보고 있는 곳은 글자 색과 굵기로만 알린다.
 *
 * 좁은 화면에서는 가운데 정렬이 성립하지 않으므로 메뉴를 아랫줄로 내린다.
 */
const NAV = [
  { href: "/explore?contentType=VIDEO", label: "영상", contentType: "VIDEO" },
  { href: "/explore?contentType=IMAGE", label: "이미지", contentType: "IMAGE" },
  { href: "/gallery", label: "갤러리" },
  { href: "/requests", label: "요청" },
  { href: "/pricing", label: "가격" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ground/90 backdrop-blur-xl">
      <div className="mx-auto grid h-16 max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 justify-self-start" aria-label="프롬픽">
          <Logo />
        </Link>

        <Suspense fallback={<div />}>
          <Nav />
        </Suspense>

        <div className="flex items-center gap-2 justify-self-end">
          <Suspense fallback={null}>
            <HeaderSearch />
          </Suspense>
          <Suspense fallback={null}>
            <AccountArea />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={null}>
        <NarrowNav />
      </Suspense>
    </header>
  );
}

/**
 * 로고.
 *
 * 마크와 글자를 가로로 세운다. 원본은 세로 조합인데, 상단바가 64px이라 그대로 넣으면 글자가
 * 읽을 수 없는 크기가 된다.
 *
 * 마크는 짙은 남색이라 흰 바탕 위에 얹는다 — 어두운 상단바에 그대로 올리면 배경에 묻힌다.
 * 글자는 흰색으로 뽑아둔 것을 쓰므로 바탕이 필요 없다.
 *
 * 그림을 못 불러오면 글자로 돌아간다. 깨진 그림 아이콘을 보여주는 것보다 낫다.
 */
function Logo() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="text-[18px] font-bold tracking-[-0.04em] text-ink">PromPick</span>;
  }

  return (
    <>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-mark.png"
          alt=""
          className="h-7 w-7 object-contain"
          onError={() => setFailed(true)}
        />
      </span>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-wordmark.png"
        alt=""
        className="h-[15px] w-auto"
        onError={() => setFailed(true)}
      />
    </>
  );
}

/** 지금 보고 있는 메뉴가 어느 것인지 */
function useActiveHref() {
  const pathname = usePathname();
  const contentType = useSearchParams().get("contentType");

  return (item: (typeof NAV)[number]) =>
    "contentType" in item
      ? pathname === "/explore" && contentType === item.contentType
      : pathname.startsWith(item.href);
}

function Nav() {
  const isActive = useActiveHref();

  return (
    <nav className="hidden items-center gap-7 justify-self-center md:flex">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item) ? "page" : undefined}
          className={cn(
            "text-[15px] transition-colors",
            isActive(item) ? "font-semibold text-ink" : "text-ink-soft hover:text-ink",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

/** 좁은 화면용 아랫줄 메뉴. 가운데 정렬 대신 밀어서 보는 줄이 된다 */
function NarrowNav() {
  const isActive = useActiveHref();

  return (
    <nav className="scroll-row flex h-11 items-center gap-1 overflow-x-auto border-t border-line px-2 md:hidden">
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item) ? "page" : undefined}
          className={cn(
            "shrink-0 px-2.5 text-[14px] transition-colors",
            isActive(item) ? "font-semibold text-ink" : "text-ink-soft",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      }}
      className="hidden items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 lg:flex"
    >
      <SearchIcon />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="찾아보기"
        aria-label="템플릿 검색"
        className="w-24 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-faint xl:w-32"
      />
    </form>
  );
}

function AccountArea() {
  const { loading, signedIn, me, signOut } = useSession();
  const pathname = usePathname();

  if (loading) return <span className="h-8 w-20" />;

  if (!signedIn) {
    return (
      <div className="flex items-center gap-1.5">
        <ButtonLink
          href={`/login?next=${encodeURIComponent(pathname)}`}
          variant="ghost"
          size="sm"
        >
          로그인
        </ButtonLink>
        {SIGNUP_OPEN && (
          <ButtonLink href="/login" size="sm">
            가입하기
          </ButtonLink>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {/*
        운영자에게만 보이는 입구.

        운영 화면은 주소를 외워서 들어가는 곳이 아니다. 템플릿을 고치다 서비스 화면으로 나와
        확인하고 다시 돌아가는 일이 잦은데, 그때마다 주소창에 /admin 을 치게 할 이유가 없다.
      */}
      {me?.role === "ADMIN" && (
        <Link
          href="/admin"
          className="rounded-lg border border-line px-2.5 py-1.5 text-[13px] font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
        >
          운영
        </Link>
      )}

      <Link
        href="/my/credits"
        className="rounded-lg bg-white/5 px-2.5 py-1.5 text-[13px] font-semibold text-ink"
      >
        <span aria-hidden>🪙</span> {me?.creditBalance?.toLocaleString() ?? 0}
      </Link>
      <Link
        href="/my/jobs"
        className="hidden rounded-lg px-2.5 py-1.5 text-[13px] text-ink-soft hover:text-ink sm:block"
      >
        {me?.nickname ?? "내 정보"}
      </Link>
      <button
        type="button"
        onClick={() => void signOut()}
        className="rounded-lg px-2.5 py-1.5 text-[13px] text-ink-faint hover:text-ink"
      >
        로그아웃
      </button>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-4 w-4 text-ink-faint"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <circle cx="9" cy="9" r="6" />
      <path d="m13.5 13.5 4 4" strokeLinecap="round" />
    </svg>
  );
}
