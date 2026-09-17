"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import { Card, StatTile } from "@/widgets/admin-shell/Card";

/**
 * 대시보드.
 *
 * 운영자가 아침에 한 번 보고 "오늘 뭘 해야 하나"를 알 수 있어야 한다.
 * 그래서 숫자보다 먼저 "손봐야 할 것"을 보여준다.
 */
export function AdminDashboard() {
  const { data: templates } = useQuery({
    queryKey: adminKeys.templates(),
    queryFn: () => adminApi.templates(),
  });

  const { data: models } = useQuery({
    queryKey: adminKeys.models(),
    queryFn: () => adminApi.modelsAll(),
  });

  const published = templates?.filter((t) => t.status === "PUBLISHED") ?? [];
  const drafts = templates?.filter((t) => t.status !== "PUBLISHED") ?? [];
  const totalGenerations = published.reduce((sum, t) => sum + t.generationCount, 0);
  const activeModels = models?.filter((m) => m.active) ?? [];

  // 게시하려면 아직 뭐가 빠졌는지
  const blocked = (templates ?? [])
    .filter((t) => t.status !== "PUBLISHED")
    .map((t) => ({
      template: t,
      missing: [
        t.mediaCount === 0 && "예시",
        !t.hasActivePipeline && "제작 방법",
        t.promptAccess !== "HIDDEN" && !t.hasPublicPrompt && "프롬프트 원문",
      ].filter(Boolean) as string[],
    }))
    .filter((x) => x.missing.length > 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="게시된 템플릿" value={published.length} unit="개" />
        <StatTile label="작성 중" value={drafts.length} unit="개" hint="게시 전 상태" />
        <StatTile label="누적 제작" value={totalGenerations} unit="건" />
        <StatTile
          label="쓸 수 있는 AI"
          value={activeModels.length}
          unit={`/ ${models?.length ?? 0}`}
          hint="켜둔 모델만 제작 방법에서 고를 수 있어요"
        />
      </div>

      {blocked.length > 0 && (
        <Card
          title="게시하려면 손봐야 해요"
          description="아래가 채워져야 사용자에게 보여요"
          action={
            <Link href="/admin/templates" className="text-[12px] text-accent hover:underline">
              템플릿으로
            </Link>
          }
        >
          <ul className="divide-y divide-line">
            {blocked.map(({ template, missing }) => (
              <li key={template.id} className="flex flex-wrap items-center gap-3 py-2.5 first:pt-0">
                <Link
                  href={`/admin/templates/${template.id}`}
                  className="text-[13px] text-ink hover:underline"
                >
                  {template.title}
                </Link>
                <span className="text-[12px] text-ink-faint">{template.categoryName}</span>
                <span className="ml-auto flex gap-1.5">
                  {missing.map((m) => (
                    <span
                      key={m}
                      className="rounded-full bg-paid-soft px-2 py-0.5 text-[11px] text-paid"
                    >
                      {m}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="많이 만든 템플릿"
          action={
            <Link href="/admin/templates" className="text-[12px] text-accent hover:underline">
              전체
            </Link>
          }
        >
          {published.length === 0 ? (
            <p className="py-6 text-[13px] text-ink-soft">아직 게시된 템플릿이 없어요.</p>
          ) : (
            <ul className="divide-y divide-line">
              {[...published]
                .sort((a, b) => b.generationCount - a.generationCount)
                .slice(0, 5)
                .map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                    <Link
                      href={`/admin/templates/${t.id}`}
                      className="truncate text-[13px] text-ink hover:underline"
                    >
                      {t.title}
                    </Link>
                    <span className="ml-auto text-[12px] text-ink-soft">
                      {t.generationCount.toLocaleString()}건
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </Card>

        <Card
          title="AI 사용 설정"
          description="약관을 확인하고 키를 넣은 모델만 켜요"
          action={
            <Link href="/admin/ai-models" className="text-[12px] text-accent hover:underline">
              전체
            </Link>
          }
        >
          <ul className="divide-y divide-line">
            {(models ?? []).slice(0, 6).map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2.5 first:pt-0">
                <span className="text-[13px] text-ink">{m.displayName}</span>
                <span className="text-[11px] text-ink-faint">{m.provider}</span>
                <span className="ml-auto text-[12px] text-ink-soft">
                  {m.unitCostKrw.toLocaleString()}원
                </span>
                <span
                  className={
                    m.active
                      ? "rounded-full bg-free-soft px-2 py-0.5 text-[11px] text-free"
                      : "rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-faint"
                  }
                >
                  {m.active ? "사용 중" : "꺼짐"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="아직 만들지 않은 화면">
        <p className="text-[13px] leading-relaxed text-ink-soft">
          생성 작업 모니터링은 제작 기능과 함께, 회원·프롬비 원장은 결제와 함께 붙여요.
          사이드바에 자리는 잡아 두었어요.
        </p>
      </Card>
    </div>
  );
}
