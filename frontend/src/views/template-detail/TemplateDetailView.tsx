"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { generationApi, generationKeys } from "@/entities/generation/api/generationApi";
import { isPlayableVideo } from "@/entities/template/lib/media";
import { PromptBlock } from "@/entities/template/ui/PromptBlock";
import type { TemplateDetail } from "@/entities/template/model/types";
import { useSession } from "@/shared/auth/SessionProvider";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { EditTemplateLink } from "@/widgets/admin-shortcut/EditTemplateLink";

/**
 * 템플릿 상세.
 *
 * 왼쪽에 결과물, 오른쪽에 정보와 행동. 결과물을 크게 두는 이유는 여기 온 사람이 가장
 * 먼저 확인하려는 것이 "그래서 뭐가 나오는데?"이기 때문이다.
 *
 * 만들기 버튼은 화면 아래에 붙여 둔다. 설명을 읽다가 결심이 서는 지점이 사람마다 달라서,
 * 스크롤 위치와 상관없이 항상 닿아야 한다.
 */
export function TemplateDetailView({ template }: { template: TemplateDetail }) {
  /**
   * 오늘 남은 무료 횟수.
   *
   * 로그인한 무료 템플릿에서만 물어본다. 유료 템플릿이나 로그인 전에는 알 필요가 없고,
   * 필요 없는 요청을 모든 상세 화면에서 한 번씩 보낼 이유가 없다.
   */
  const router = useRouter();
  const { signedIn, loading } = useSession();
  const [index, setIndex] = useState(0);

  const media = template.media[index] ?? template.media[0];
  const free = template.generateAccess === "FREE";

  const { data: freeUsage } = useQuery({
    queryKey: generationKeys.freeUsage(),
    queryFn: () => generationApi.freeUsage(),
    enabled: free && signedIn,
  });

  const outOfFree = free && freeUsage != null && freeUsage.remaining <= 0;

  /**
   * 버튼에 적을 말.
   *
   * 그냥 "만들기"보다 "2회 무료 만들기"가 낫다. 무료라는 사실만으로는 지금 눌러도 되는지
   * 알 수 없지만, 남은 횟수를 보면 바로 안다. 다 쓴 경우에는 눌러봐야 막히므로 아예 그렇게
   * 적는다 — 눌러보고 나서 실패를 알게 되는 것이 가장 나쁘다.
   *
   * 로그인 전에는 횟수를 모른다. 그때는 무료라는 것만 알린다.
   */
  const actionLabel = !free
    ? "만들기"
    : !signedIn
      ? "무료로 만들기"
      : freeUsage == null
        ? "만들기"
        : freeUsage.remaining > 0
          ? `${freeUsage.remaining}회 무료 만들기`
          : "오늘 무료 횟수를 다 썼어요";

  function startCreate() {
    const target = `/t/${template.slug}/create`;
    router.push(signedIn ? target : `/login?next=${encodeURIComponent(target)}`);
  }

  return (
    <main className="flex-1 pb-24">
      <div className="mx-auto max-w-[1280px] px-4 py-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start">
          {/* 결과물 */}
          <div className="lg:sticky lg:top-20">
            <div
              className="overflow-hidden rounded-xl bg-surface"
              style={{ aspectRatio: template.output.ratio.replace(":", " / ") }}
            >
              {isPlayableVideo(media?.url) ? (
                <video
                  src={media.url ?? undefined}
                  poster={media.thumbnailUrl ?? undefined}
                  muted
                  loop
                  autoPlay
                  playsInline
                  controls
                  className="h-full w-full object-cover"
                />
              ) : media?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media.url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-[12px] text-ink-faint">
                  예시 준비 중
                </div>
              )}
            </div>

            {template.media.length > 1 && (
              <div className="scroll-row mt-2 flex gap-2 overflow-x-auto">
                {template.media.map((m, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`예시 ${i + 1}`}
                    className={cn(
                      "h-16 w-12 shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                      i === index ? "border-accent" : "border-transparent opacity-60",
                    )}
                  >
                    {m.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 정보 */}
          <div className="space-y-7">
            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href={`/explore?contentType=${template.contentType}`}
                  className="text-[12px] text-ink-faint hover:text-ink"
                >
                  {template.contentType === "VIDEO" ? "영상" : "이미지"}
                </Link>
                <EditTemplateLink slug={template.slug} />
              </div>

              <h1 className="text-[28px] font-bold leading-tight tracking-[-0.04em] text-ink sm:text-[34px]">
                {template.title}
              </h1>

              {template.description && (
                <p className="text-[15px] leading-relaxed text-ink-soft">{template.description}</p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span
                  className={cn(
                    "rounded-md px-2 py-1 text-[12px] font-semibold",
                    free ? "bg-accent/15 text-accent" : "bg-white/8 text-paid",
                  )}
                >
                  {free ? "무료로 제작" : `🪙 ${template.generateCost.toLocaleString()}`}
                </span>
                {template.promptAccess !== "HIDDEN" && (
                  <span className="rounded-md bg-white/8 px-2 py-1 text-[12px] font-medium text-ink-soft">
                    {template.promptAccess === "FREE"
                      ? "프롬프트 공개"
                      : `프롬프트 🪙 ${template.promptCost}`}
                  </span>
                )}
              </div>
            </header>

            <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2.5 text-[13px]">
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
              <dt className="text-ink-faint">필요한 사진</dt>
              <dd className="text-ink">{template.requiredPhotoSummary ?? "사진 1장"}</dd>
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

            {template.uploadGuide?.checklist && template.uploadGuide.checklist.length > 0 && (
              <section>
                <h2 className="text-[15px] font-semibold text-ink">이렇게 찍어 주세요</h2>
                <ul className="mt-3 space-y-2">
                  {template.uploadGuide.checklist.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-soft">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
                {template.uploadGuide.resultNote && (
                  <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
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
                    className="rounded-md bg-white/5 px-2.5 py-1 text-[12px] text-ink-soft hover:text-ink"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 하단 고정 행동 */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ground/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink">{template.title}</p>
            <p className="text-[12px] text-ink-faint">
              {free ? "무료" : `🪙 ${template.generateCost.toLocaleString()}`} · 약{" "}
              {Math.round(template.estimatedSeconds / 60)}분
            </p>
          </div>
          <Button
            size="lg"
            onClick={startCreate}
            disabled={loading || outOfFree}
            className="shrink-0"
          >
            {actionLabel}
          </Button>
        </div>
      </div>
    </main>
  );
}
