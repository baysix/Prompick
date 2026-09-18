import { templateApi } from "@/entities/template/api/templateApi";
import type { HomeData } from "@/entities/template/model/types";
import { SearchHero } from "@/widgets/hero/SearchHero";
import { TypeTiles } from "@/widgets/showcase/TypeTiles";
import { ClosingCta, HowItWorks } from "@/widgets/showcase/HowItWorks";
import { TemplateRow } from "@/widgets/template-row/TemplateRow";
import { SiteFooter } from "@/widgets/site-footer/SiteFooter";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";

// 홈은 검색 유입의 입구다. 서버에서 그려 내려보내고 1분마다 갱신한다.
export const revalidate = 60;

export default async function HomePage() {
  let home: HomeData = { sections: [] };
  let failed = false;

  try {
    home = await templateApi.home();
  } catch {
    failed = true;
  }

  // 같은 템플릿이 여러 섹션에 나오므로 한 번씩만 남긴다
  const all = Array.from(
    new Map(home.sections.flatMap((s) => s.items).map((t) => [t.slug, t])).values(),
  );
  const video = all.filter((t) => t.contentType === "VIDEO");
  const image = all.filter((t) => t.contentType === "IMAGE");

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <SearchHero />

        {failed ? (
          <Notice
            title="목록을 불러오지 못했어요"
            body="백엔드가 실행 중인지 확인해 주세요. (localhost:8080)"
          />
        ) : home.sections.length === 0 ? (
          <Notice
            title="아직 게시된 템플릿이 없어요"
            body="관리자 화면에서 템플릿을 게시하면 여기에 나타나요."
          />
        ) : (
          <>
            <TypeTiles video={video} image={image} />

            <div className="mx-auto max-w-7xl">
              {home.sections.slice(0, 2).map((section) => (
                <TemplateRow key={section.key} section={section} />
              ))}
            </div>

            <HowItWorks />

            <div className="mx-auto max-w-7xl">
              {home.sections.slice(2).map((section) => (
                <TemplateRow key={section.key} section={section} />
              ))}
            </div>

            <ClosingCta />
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <p className="text-[16px] font-semibold text-ink">{title}</p>
      <p className="mt-1.5 text-[14px] text-ink-soft">{body}</p>
    </div>
  );
}
