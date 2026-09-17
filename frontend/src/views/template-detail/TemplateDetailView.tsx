import Link from "next/link";
import { isPlayableVideo } from "@/entities/template/lib/media";
import { PromptBlock } from "@/entities/template/ui/PromptBlock";
import { GenerateBadge } from "@/entities/template/ui/AccessBadge";
import { GenerateButton } from "@/entities/template/ui/TemplateActions";
import type { TemplateDetail } from "@/entities/template/model/types";

/**
 * 템플릿 상세.
 *
 * 예시 결과물이 화면 위쪽을 지배한다. 이 서비스에서 사용자가 가장 먼저 확인하고 싶은 것이
 * "그래서 뭐가 나오는데?"이기 때문이다.
 */
export function TemplateDetailView({ template }: { template: TemplateDetail }) {
  const primary = template.media[0];

  return (
    <main className="flex-1 pb-28">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-8 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)] md:items-start">
          {/* 결과물 */}
          <div className="md:sticky md:top-20">
            {/*
              모바일에서 9:16 예시를 그대로 두면 첫 화면을 통째로 차지해, 제목과 가격을 보려면
              스크롤해야 한다. 높이를 제한해 결과물과 정보가 함께 들어오게 한다.
            */}
            <div
              className="mx-auto max-h-[52vh] overflow-hidden bg-surface md:max-h-none"
              style={{ aspectRatio: template.output.ratio.replace(":", " / ") }}
            >
              {isPlayableVideo(primary?.url) ? (
                <video
                  src={primary.url ?? undefined}
                  poster={primary.thumbnailUrl ?? undefined}
                  muted
                  loop
                  autoPlay
                  playsInline
                  controls
                  className="h-full w-full object-contain"
                />
              ) : primary?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={primary.url} alt="" className="h-full w-full object-contain" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="text-[12px] text-ink-faint">예시 준비 중</span>
                </div>
              )}
            </div>

            {template.media.length > 1 && (
              <div className="scroll-row mt-2 flex gap-2 overflow-x-auto">
                {template.media.slice(1).map((m, i) => (
                  <div key={i} className="h-16 w-12 shrink-0 overflow-hidden bg-surface">
                    {m.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.thumbnailUrl} alt="" className="h-full w-full object-contain" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 설명 */}
          <div className="space-y-7">
            <header className="space-y-2.5">
              <Link
                href={`/explore?category=${template.categorySlug}`}
                className="text-[12px] text-ink-faint hover:text-ink"
              >
                {template.categoryName}
              </Link>
              <h1 className="text-[24px] font-semibold leading-tight tracking-tight text-ink">
                {template.title}
              </h1>
              {template.description && (
                <p className="text-[14px] leading-relaxed text-ink-soft">{template.description}</p>
              )}
              {template.requiredPhotoSummary && (
                <p className="text-[13px] text-ink">{template.requiredPhotoSummary}이면 만들 수 있어요</p>
              )}
            </header>

            {/* 결과 정보. 가운뎃점으로 잇지 않고 표로 세운다 */}
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[13px]">
              <dt className="text-ink-faint">종류</dt>
              <dd className="text-ink">{template.contentType === "VIDEO" ? "영상" : "이미지"}</dd>

              {template.output.durationSeconds && (
                <>
                  <dt className="text-ink-faint">길이</dt>
                  <dd className="text-ink">{template.output.durationSeconds}초</dd>
                </>
              )}

              <dt className="text-ink-faint">비율</dt>
              <dd className="text-ink">{template.output.ratio}</dd>

              {template.output.resolution && (
                <>
                  <dt className="text-ink-faint">해상도</dt>
                  <dd className="text-ink">{template.output.resolution}</dd>
                </>
              )}

              <dt className="text-ink-faint">걸리는 시간</dt>
              <dd className="text-ink">약 {Math.round(template.estimatedSeconds / 60)}분</dd>

              <dt className="text-ink-faint">만든 사람</dt>
              <dd className="text-ink">{template.generationCount.toLocaleString()}명</dd>
            </dl>

            <PromptBlock
              slug={template.slug}
              access={template.promptAccess}
              cost={template.promptCost}
              prompt={template.prompt}
            />

            {/* 촬영 가이드 */}
            {template.uploadGuide?.checklist && template.uploadGuide.checklist.length > 0 && (
              <section className="space-y-2.5">
                <h2 className="text-[14px] font-medium text-ink">이렇게 찍어 주세요</h2>
                <ul className="space-y-1.5">
                  {template.uploadGuide.checklist.map((item, i) => (
                    <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                      <CheckMark />
                      {item}
                    </li>
                  ))}
                </ul>
                {template.uploadGuide.resultNote && (
                  <p className="border-l-2 border-line pl-3 text-[13px] leading-relaxed text-ink-soft">
                    {template.uploadGuide.resultNote}
                  </p>
                )}
              </section>
            )}

            {template.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {template.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/search?q=${encodeURIComponent(tag)}`}
                    className="rounded-sm border border-line px-2 py-0.5 text-[12px] text-ink-soft hover:text-ink"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            <p className="text-[12px] leading-relaxed text-ink-faint">
              AI가 만드는 결과물이라 매번 조금씩 달라요. 예시와 완전히 같지는 않을 수 있어요.
            </p>
          </div>
        </div>
      </div>

      {/* 하단 고정 액션 */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-ground/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <GenerateBadge access={template.generateAccess} cost={template.generateCost} />
          </div>
          <GenerateButton
            slug={template.slug}
            access={template.generateAccess}
            cost={template.generateCost}
          />
        </div>
      </div>
    </main>
  );
}

function CheckMark() {
  return (
    <svg
      viewBox="0 0 12 12"
      className="mt-[5px] h-2.5 w-2.5 shrink-0 text-ink"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      aria-hidden
    >
      <path d="M1.5 6.5 4.5 9.5 10.5 2.5" />
    </svg>
  );
}
