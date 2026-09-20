"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * 푸터.
 *
 * 필요할 때 찾는 것만 모은다. 이용약관·개인정보·환불정책은 결제 심사에 반드시 필요하다.
 */
const GROUPS = [
  {
    title: "둘러보기",
    links: [
      { href: "/explore?contentType=VIDEO", label: "영상" },
      { href: "/explore?contentType=IMAGE", label: "이미지" },
      { href: "/gallery", label: "갤러리" },
      { href: "/requests", label: "요청" },
    ],
  },
  {
    title: "이용",
    links: [
      { href: "/pricing", label: "가격" },
      { href: "/notice", label: "공지사항" },
      { href: "/help", label: "도움말" },
      { href: "/report", label: "오류 신고" },
    ],
  },
  {
    title: "약관",
    links: [
      { href: "/terms", label: "이용약관" },
      { href: "/privacy", label: "개인정보처리방침" },
      { href: "/refund", label: "환불정책" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line">
      <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <FooterLogo />
          <p className="mt-4 max-w-[20rem] text-[13px] leading-relaxed text-ink-soft">
            유행하는 AI 영상·이미지의 프롬프트를 모으고, 사진 한 장으로 대신 만들어 드려요.
          </p>
        </div>

        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-[13px] font-semibold text-ink">{group.title}</p>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[13px] text-ink-soft hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-[1280px] px-4 py-5 text-[12px] leading-relaxed text-ink-faint">
          AI가 만드는 결과물이라 매번 조금씩 달라요. 예시와 완전히 같지는 않을 수 있어요.
        </p>
      </div>
    </footer>
  );
}

/**
 * 푸터 로고.
 *
 * 여기는 상단바와 달리 세로 공간이 있어서 원본의 세로 조합을 그대로 쓴다. 마크와 이름이 함께
 * 놓인 형태가 브랜드의 원래 모습이고, 페이지 끝은 그것을 한 번 더 보여주기 좋은 자리다.
 *
 * 흰색으로 뽑아둔 것을 쓴다. 원본은 짙은 남색이라 어두운 바탕에서 보이지 않는다.
 * 그림을 못 불러오면 글자로 돌아간다.
 */
function FooterLogo() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <p className="text-[17px] font-bold tracking-[-0.04em] text-ink">PromPick</p>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-full-white.png"
      alt="프롬픽"
      className="h-20 w-auto"
      onError={() => setFailed(true)}
    />
  );
}
