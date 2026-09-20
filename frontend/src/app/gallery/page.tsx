import type { Metadata } from "next";
import { templateApi } from "@/entities/template/api/templateApi";
import { TemplateTile } from "@/entities/template/ui/TemplateTile";
import type { TemplateCard } from "@/entities/template/model/types";
import { EmptyState, PageShell } from "@/widgets/page-shell/PageShell";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "갤러리",
  description: "프롬픽으로 만든 결과물을 모았어요. 마음에 드는 걸 골라 같은 방식으로 만들어 보세요.",
};

/**
 * 갤러리.
 *
 * "이거 나도 만들래"가 일어나는 자리다. 지금은 운영자가 만든 예시로 채우고,
 * 사용자가 결과물 공개에 동의하면 그것들이 여기로 올라온다.
 *
 * 각 결과물은 만든 템플릿으로 바로 이어진다. 보는 것에서 만드는 것까지 한 번에 가야 한다.
 */
export default async function GalleryPage() {
  let items: TemplateCard[] = [];
  try {
    const home = await templateApi.home();
    items = home.sections.flatMap((s) => s.items);
  } catch {
    items = [];
  }

  // 같은 템플릿이 여러 섹션에 있으므로 한 번씩만 남긴다
  const unique = Array.from(new Map(items.map((i) => [i.slug, i])).values());

  return (
    <PageShell
      title="갤러리"
      description="프롬픽으로 만든 결과물이에요. 마음에 드는 걸 누르면 같은 방식으로 만들 수 있어요."
      wide
    >
      {unique.length === 0 ? (
        <EmptyState title="아직 올라온 결과물이 없어요" body="첫 번째로 만들어서 올려보세요." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {unique.map((template, i) => (
              <TemplateTile
                key={template.slug}
                template={template}
                priority={i < 8}
              />
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-line px-6 py-8 text-center">
            <p className="text-[15px] font-semibold text-ink">내가 만든 것도 여기 올릴 수 있어요</p>
            <p className="mx-auto mt-2 max-w-md text-[13px] leading-relaxed text-ink-soft">
              만든 결과물을 공개하면 갤러리에 올라가요. 올린 사람은 다른 사람이 따라 만들 때마다
              알 수 있어요. 공개 여부는 언제든 바꿀 수 있어요.
            </p>
            <p className="mt-3 text-[12px] text-ink-faint">결과물 공개 기능은 준비 중이에요</p>
          </div>
        </>
      )}
    </PageShell>
  );
}
