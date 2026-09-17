"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import type { AdminTemplate } from "@/entities/admin/model/types";
import { cn } from "@/shared/lib/cn";
import { Card } from "@/widgets/admin-shell/Card";

/**
 * 관리자 템플릿 목록.
 *
 * 게시하려면 예시·파이프라인·(제공한다면) 프롬프트 원문이 모두 있어야 한다.
 * 무엇이 비었는지 목록에서 바로 보이게 해서, 게시 버튼을 눌러보고 나서야 알게 되지 않도록 한다.
 */
export function AdminTemplateList() {
  const { data, isPending, isError } = useQuery({
    queryKey: adminKeys.templates(),
    queryFn: () => adminApi.templates(),
  });

  return (
    <Card
      title="전체 템플릿"
      description="게시하려면 예시·제작 방법·(제공한다면) 프롬프트 원문이 모두 필요해요"
      action={
        <Link
          href="/admin/templates/new"
          className="rounded-full bg-accent px-3.5 py-1.5 text-[13px] font-semibold text-accent-ink"
        >
          새로 만들기
        </Link>
      }
    >
      <div>
        {isError ? (
          <p className="py-16 text-[13px] text-ink-soft">불러오지 못했어요.</p>
        ) : isPending ? (
          <p className="py-16 text-[13px] text-ink-faint">불러오는 중</p>
        ) : data.length === 0 ? (
          <p className="py-16 text-[13px] text-ink-soft">
            아직 템플릿이 없어요. 유행하는 콘텐츠를 하나 등록해 보세요.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {data.map((t) => (
              <TemplateRow key={t.id} template={t} />
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function TemplateRow({ template: t }: { template: AdminTemplate }) {
  const missing = [
    t.mediaCount === 0 && "예시",
    !t.hasActivePipeline && "제작 방법",
    t.promptAccess !== "HIDDEN" && !t.hasPublicPrompt && "프롬프트 원문",
  ].filter(Boolean) as string[];

  return (
    <li className="py-3">
      <Link href={`/admin/templates/${t.id}`} className="block">
        <div className="flex flex-wrap items-center gap-2">
          <StatusDot status={t.status} />
          <span className="text-[14px] font-medium text-ink">{t.title}</span>
          <span className="text-[12px] text-ink-faint">{t.categoryName}</span>

          <span className="ml-auto flex items-center gap-2 text-[12px]">
            <span className={t.generateAccess === "FREE" ? "text-free" : "text-paid"}>
              제작 {t.generateAccess === "FREE" ? "무료" : `${t.generateCost}`}
            </span>
            <span className="text-ink-faint">·</span>
            <span
              className={cn(
                t.promptAccess === "HIDDEN"
                  ? "text-ink-faint"
                  : t.promptAccess === "FREE"
                    ? "text-free"
                    : "text-paid",
              )}
            >
              프롬프트{" "}
              {t.promptAccess === "HIDDEN"
                ? "비공개"
                : t.promptAccess === "FREE"
                  ? "무료"
                  : `${t.promptCost}`}
            </span>
          </span>
        </div>

        {missing.length > 0 && (
          <p className="mt-1 text-[12px] text-[#ff6b6b]">
            게시하려면 {missing.join(", ")}이(가) 필요해요
          </p>
        )}
      </Link>
    </li>
  );
}

function StatusDot({ status }: { status: AdminTemplate["status"] }) {
  const map = {
    PUBLISHED: { color: "bg-free", label: "게시 중" },
    DRAFT: { color: "bg-ink-faint", label: "작성 중" },
    HIDDEN: { color: "bg-paid", label: "내림" },
  } as const;
  const s = map[status];
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-ink-soft">
      <span className={cn("inline-block h-1.5 w-1.5 rounded-full", s.color)} />
      {s.label}
    </span>
  );
}
