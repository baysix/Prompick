import { templateApi } from "@/entities/template/api/templateApi";
import type { Category, HomeData } from "@/entities/template/model/types";
import { SearchHero } from "@/widgets/hero/SearchHero";
import { CategoryTiles } from "@/widgets/showcase/CategoryTiles";
import { ClosingCta, HowItWorks } from "@/widgets/showcase/HowItWorks";
import { TemplateRow } from "@/widgets/template-row/TemplateRow";
import { SiteFooter } from "@/widgets/site-footer/SiteFooter";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";

// 홈은 검색 유입의 입구다. 서버에서 그려 내려보내고 1분마다 갱신한다.
export const revalidate = 60;

export default async function HomePage() {
  let home: HomeData = { sections: [] };
  let categories: Category[] = [];
  let failed = false;

  try {
    [home, categories] = await Promise.all([templateApi.home(), templateApi.categories()]);
  } catch {
    failed = true;
  }

  const all = home.sections.flatMap((s) => s.items);

  // 카테고리마다 그 안의 결과물 하나를 대표로 세운다. 이름만 나열하면 무엇이 나오는지
  // 상상해야 하는데, 그림이 있으면 고르는 판단이 즉시 이뤄진다.
  const tiles = categories.slice(0, 6).map((category) => ({
    slug: category.slug,
    name: category.name,
    sample: all.find((t) => t.categoryName === category.name) ?? null,
  }));

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <SearchHero categories={categories} />

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
            <CategoryTiles items={tiles} />

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
