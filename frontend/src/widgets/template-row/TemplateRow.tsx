import Link from "next/link";
import { TemplateFrame } from "@/entities/template/ui/TemplateFrame";
import type { HomeSection } from "@/entities/template/model/types";

/**
 * 홈의 가로 스크롤 줄.
 *
 * 제목 위에 대문자 라벨을 붙이지 않는다. 섹션 제목 자체가 문장이라 설명이 더 필요 없다.
 */
export function TemplateRow({ section }: { section: HomeSection }) {
  return (
    <section className="py-8">
      <div className="px-4">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <h2 className="text-[19px] font-bold tracking-tight text-ink">{section.title}</h2>
            {section.subtitle && (
              <p className="mt-0.5 text-[13px] text-ink-soft">{section.subtitle}</p>
            )}
          </div>
          <Link
            href={sectionLink(section.key)}
            className="shrink-0 text-[13px] text-ink-soft hover:text-ink"
          >
            더 보기
          </Link>
        </div>
      </div>

      <div className="scroll-row mt-4 overflow-x-auto">
        <div className="flex w-max gap-3 px-4">
          {section.items.map((template, index) => (
            <TemplateFrame
              key={template.slug}
              template={template}
              priority={index < 3}
              className="w-[150px] shrink-0 snap-start sm:w-[176px]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/** 섹션마다 "더 보기"가 가야 할 탐색 조건 */
function sectionLink(key: string): string {
  switch (key) {
    case "free-prompt":
      return "/explore?promptOnly=true&pricing=FREE";
    case "free-generate":
      return "/explore?pricing=FREE";
    case "exclusive":
      return "/explore";
    case "newest":
      return "/explore?sort=LATEST";
    default:
      return "/explore";
  }
}
