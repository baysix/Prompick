import { templateApi } from "@/entities/template/api/templateApi";
import { TransformHero } from "@/widgets/hero/TransformHero";
import { TemplateRow } from "@/widgets/template-row/TemplateRow";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";
import type { HomeData } from "@/entities/template/model/types";

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

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-16">
        <TransformHero />

        {failed ? (
          <NoticeBlock
            title="목록을 불러오지 못했어요"
            body="백엔드가 실행 중인지 확인해 주세요. (localhost:8080)"
          />
        ) : home.sections.length === 0 ? (
          <NoticeBlock
            title="아직 게시된 템플릿이 없어요"
            body="관리자 화면에서 템플릿을 게시하면 여기에 나타나요."
          />
        ) : (
          <div className="divide-y divide-line">
            {home.sections.map((section) => (
              <TemplateRow key={section.key} section={section} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function NoticeBlock({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-[15px] font-medium text-ink">{title}</p>
      <p className="mt-1 text-[13px] text-ink-soft">{body}</p>
    </div>
  );
}
