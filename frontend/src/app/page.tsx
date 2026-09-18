import { templateApi } from "@/entities/template/api/templateApi";
import type { HomeData, TemplateCard } from "@/entities/template/model/types";
import { GradientHero } from "@/widgets/hero/GradientHero";
import { PopularSection } from "@/widgets/showcase/PopularSection";
import { ClosingCta, HowItWorks } from "@/widgets/showcase/HowItWorks";
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
  const all: TemplateCard[] = Array.from(
    new Map(home.sections.flatMap((s) => s.items).map((t) => [t.slug, t])).values(),
  );
  const video = all.filter((t) => t.contentType === "VIDEO");
  const image = all.filter((t) => t.contentType === "IMAGE");

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <GradientHero samples={all} />

        {failed ? (
          <Notice
            title="목록을 불러오지 못했어요"
            body="백엔드가 실행 중인지 확인해 주세요. (localhost:8080)"
          />
        ) : all.length === 0 ? (
          <Notice
            title="아직 게시된 템플릿이 없어요"
            body="관리자 화면에서 템플릿을 게시하면 여기에 나타나요."
          />
        ) : (
          <>
            <PopularSection
              title="인기 영상으로 시작하세요"
              items={video}
              moreHref="/explore?contentType=VIDEO"
              moreLabel="영상 더 둘러보기"
            />

            <div className="border-t border-line" />

            <PopularSection
              title="인기 이미지로 시작하세요"
              items={image}
              moreHref="/explore?contentType=IMAGE"
              moreLabel="이미지 더 둘러보기"
            />

            <HowItWorks />
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
