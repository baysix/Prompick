import Link from "next/link";
import { templateApi } from "@/entities/template/api/templateApi";
import type { HomeData, TemplateCard } from "@/entities/template/model/types";
import { ArrowIcon } from "@/shared/ui/Button";
import { PromoBanner } from "@/widgets/showcase/PromoBanner";
import { PresetSection } from "@/widgets/showcase/PresetSection";
import { SiteFooter } from "@/widgets/site-footer/SiteFooter";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";

// 홈은 검색 유입의 입구다. 서버에서 그려 내려보내고 1분마다 갱신한다.
export const revalidate = 60;

/**
 * 홈.
 *
 * 결과물부터 보여준다. 이 서비스를 한 문장으로 설명하는 것보다 유행하는 영상 한 편을
 * 보여주는 쪽이 빠르다 — 사람들은 이미 그 영상을 인스타에서 봤고, 그래서 여기 온다.
 * 설명은 그 아래에서 해도 늦지 않다.
 *
 * 묶음을 여러 개 두되 같은 결과물을 반복해서 깔지는 않는다. 같은 것이 제목만 바꿔
 * 네 번 나오면 볼 것이 많은 게 아니라 없다는 뜻으로 읽힌다.
 */
export default async function HomePage() {
  let home: HomeData = { sections: [] };
  let failed = false;

  try {
    home = await templateApi.home();
  } catch {
    failed = true;
  }

  // 같은 템플릿이 여러 묶음에 나오므로 한 번씩만 남긴다
  const all: TemplateCard[] = Array.from(
    new Map(home.sections.flatMap((s) => s.items).map((t) => [t.slug, t])).values(),
  );

  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-[1280px] space-y-3 px-4 py-4">
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
              <PresetSection
                primary
                title="지금 유행하는 AI 영상·이미지"
                description="인스타·쇼츠에서 본 그 결과물이에요. 사진 한 장만 올리면 대신 만들어 드려요."
                items={all}
                href="/explore"
                ctaLabel="전부 둘러보기"
              />

              <HowItWorks />
            </>
          )}

          <PromoBanner />
        </div>
      </main>

      <SiteFooter />
    </>
  );
}

/**
 * 쓰는 방법.
 *
 * 이 서비스에는 길이 두 갈래다 — 프롬프트를 받아 직접 만들거나, 맡기거나.
 * 이걸 모르면 상세 화면에서 버튼 두 개를 보고 멈춘다. 그래서 첫 화면에서 미리 말해둔다.
 */
function HowItWorks() {
  const WAYS = [
    {
      title: "프롬프트를 받아 갑니다",
      body: "원문을 그대로 드려요. 쓰던 AI에 붙여넣어 직접 만들면 돼요.",
      href: "/explore?promptOnly=true",
      cta: "프롬프트 있는 것만 보기",
    },
    {
      title: "사진만 올리고 맡깁니다",
      body: "어떤 AI를 몇 단계로 쓰는지는 신경 쓰지 않아도 돼요. 결과물만 받으세요.",
      href: "/explore?pricing=FREE",
      cta: "무료로 만들 수 있는 것 보기",
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {WAYS.map((way) => (
        <Link
          key={way.title}
          href={way.href}
          className="group rounded-2xl border border-line px-5 py-6 transition-colors hover:border-ink-faint"
        >
          <p className="text-[16px] font-semibold text-ink">{way.title}</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{way.body}</p>
          <p className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent">
            {way.cta}
            <ArrowIcon />
          </p>
        </Link>
      ))}
    </section>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-line px-6 py-20 text-center">
      <p className="text-[16px] font-semibold text-ink">{title}</p>
      <p className="mt-1.5 text-[14px] text-ink-soft">{body}</p>
    </div>
  );
}
