import Link from "next/link";
import { SERVICE } from "@/shared/config/env";

/**
 * 푸터.
 *
 * 필요할 때 찾는 것들을 모은다. 이용약관·개인정보·환불정책은 결제 심사에 반드시 필요하다.
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
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-[15px] font-bold text-ink">{SERVICE.name}</p>
          <p className="mt-2 max-w-[22rem] text-[13px] leading-relaxed text-ink-soft">
            유행하는 AI 영상·이미지의 프롬프트를 모으고, 사진 한 장으로 대신 만들어 드려요.
          </p>
        </div>

        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-[13px] font-semibold text-ink">{group.title}</p>
            <ul className="mt-2.5 space-y-1.5">
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
        <p className="mx-auto max-w-7xl px-4 py-5 text-[12px] leading-relaxed text-ink-faint">
          AI가 만드는 결과물이라 매번 조금씩 달라요. 예시와 완전히 같지는 않을 수 있어요.
        </p>
      </div>
    </footer>
  );
}
