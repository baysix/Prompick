"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import type { AdminTemplate } from "@/entities/admin/model/types";
import { ButtonLink } from "@/shared/ui/Button";
import { Badge, Card } from "@/widgets/admin-shell/Card";
import { missingParts } from "./ExposureWarning";

/**
 * 운영 첫 화면.
 *
 * 숫자를 늘어놓기보다 "지금 손봐야 할 것"을 먼저 보여준다. 공개해뒀는데 실행이 안 되는
 * 템플릿은 그냥 오류가 아니라 매출이 새는 구멍이다.
 */
export function AdminDashboard() {
  const { data: templates, isPending } = useQuery({
    queryKey: adminKeys.templates(),
    queryFn: adminApi.templates,
  });

  if (isPending) return <p className="text-[13px] text-ink-faint">불러오는 중</p>;

  const all = templates ?? [];
  const published = all.filter((t) => t.status === "PUBLISHED");
  const broken = published.filter((t) => missingParts(t).length > 0);
  const drafts = all.filter((t) => t.status === "DRAFT");
  const generations = all.reduce((sum, t) => sum + t.generationCount, 0);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="공개 중" value={published.length} />
        <Stat label="작성 중" value={drafts.length} />
        <Stat label="누적 제작" value={generations} />
        <Stat label="손봐야 할 것" value={broken.length} alert={broken.length > 0} />
      </div>

      <Card
        title="공개했는데 비어 있어요"
        description="사용자에게 보이지만 프롬프트나 파이프라인이 없어요. 누르면 막힙니다."
        actions={
          <ButtonLink href="/admin/templates" variant="secondary" size="sm">
            전체 목록
          </ButtonLink>
        }
      >
        {broken.length === 0 ? (
          <p className="text-[13px] text-ink-soft">지금은 없어요. 공개한 것 모두 정상이에요.</p>
        ) : (
          <ul className="space-y-2">
            {broken.map((t) => (
              <BrokenRow key={t.id} template={t} />
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="많이 만든 템플릿"
        description="어떤 스타일이 먹히는지 보여줘요. 다음에 무엇을 만들지 여기서 정합니다."
      >
        {all.length === 0 ? (
          <p className="text-[13px] text-ink-soft">아직 템플릿이 없어요.</p>
        ) : (
          <ol className="space-y-1">
            {[...all]
              .sort((a, b) => b.generationCount - a.generationCount)
              .slice(0, 8)
              .map((t, i) => (
                <li key={t.id} className="flex items-center gap-3 py-1.5">
                  <span className="w-4 text-right font-mono text-[12px] text-ink-faint">
                    {i + 1}
                  </span>
                  <Link
                    href={`/admin/templates/${t.id}`}
                    className="min-w-0 flex-1 truncate text-[14px] text-ink hover:underline"
                  >
                    {t.title}
                  </Link>
                  <span className="font-mono text-[13px] text-ink-soft">
                    {t.generationCount.toLocaleString()}
                  </span>
                </li>
              ))}
          </ol>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-5 py-4">
      <p className="text-[12px] text-ink-soft">{label}</p>
      <p
        className={`mt-1 font-mono text-[26px] font-semibold tracking-tight ${
          alert ? "text-paid" : "text-ink"
        }`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function BrokenRow({ template }: { template: AdminTemplate }) {
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-lg bg-ground px-3.5 py-2.5">
      <Link
        href={`/admin/templates/${template.id}`}
        className="min-w-0 flex-1 truncate text-[14px] font-medium text-ink hover:underline"
      >
        {template.title}
      </Link>
      {missingParts(template).map((part) => (
        <Badge key={part} tone="warn">
          {part} 없음
        </Badge>
      ))}
    </li>
  );
}
