"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import type { AdminTemplate, TemplateStatus } from "@/entities/admin/model/types";
import { cn } from "@/shared/lib/cn";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Badge, Input } from "@/widgets/admin-shell/Card";
import { missingParts } from "./ExposureWarning";

/**
 * 템플릿 목록.
 *
 * 한 줄에서 상태·요금·빠진 것을 모두 읽을 수 있어야 한다. 하나씩 열어봐야 알 수 있으면
 * 템플릿이 쉰 개만 되어도 관리가 불가능해진다.
 */
const FILTERS: { label: string; status?: TemplateStatus }[] = [
  { label: "전체" },
  { label: "공개 중", status: "PUBLISHED" },
  { label: "작성 중", status: "DRAFT" },
  { label: "숨김", status: "HIDDEN" },
];

const TYPES: { label: string; value?: "VIDEO" | "IMAGE" }[] = [
  { label: "전체" },
  { label: "영상", value: "VIDEO" },
  { label: "이미지", value: "IMAGE" },
];

export function AdminTemplateList() {
  const [filter, setFilter] = useState(0);
  const [type, setType] = useState(0);
  const [keyword, setKeyword] = useState("");

  const { data, isPending } = useQuery({
    queryKey: adminKeys.templates(),
    queryFn: adminApi.templates,
  });

  const status = FILTERS[filter].status;
  const contentType = TYPES[type].value;

  const rows = (data ?? [])
    .filter((t) => !status || t.status === status)
    .filter((t) => !contentType || t.contentType === contentType)
    .filter((t) =>
      keyword.trim() === ""
        ? true
        : `${t.title} ${t.slug}`.toLowerCase().includes(keyword.trim().toLowerCase()),
    );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* 만드는 것이 영상이냐 이미지냐가 첫 갈래다. 상태보다 먼저 좁혀진다 */}
        <div className="flex gap-1 rounded-xl bg-surface p-1">
          {TYPES.map((t, i) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setType(i)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                i === type ? "bg-white/12 font-semibold text-ink" : "text-ink-soft hover:text-ink",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <span className="h-5 w-px bg-line" aria-hidden />

        <div className="flex gap-1">
          {FILTERS.map((f, i) => (
            <button
              key={f.label}
              type="button"
              onClick={() => setFilter(i)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[13px] transition-colors",
                i === filter ? "bg-white/8 font-semibold text-ink" : "text-ink-soft hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="제목이나 주소로 찾기"
          className="w-56"
        />

        <ButtonLink href="/admin/templates/new" size="sm" className="ml-auto">
          새 템플릿
        </ButtonLink>
      </div>

      {isPending ? (
        <p className="text-[13px] text-ink-faint">불러오는 중</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-line py-16 text-center text-[13px] text-ink-soft">
          조건에 맞는 템플릿이 없어요.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-line bg-surface text-[12px] text-ink-soft">
                <Th className="w-full">템플릿</Th>
                <Th>프롬프트</Th>
                <Th>제작</Th>
                <Th className="text-right">제작수</Th>
                <Th>상태</Th>
                <Th />
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <Row key={t.id} template={t} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({ template }: { template: AdminTemplate }) {
  const queryClient = useQueryClient();
  const missing = missingParts(template);
  const live = template.status === "PUBLISHED";

  const toggle = useMutation({
    mutationFn: () => (live ? adminApi.unpublish(template.id) : adminApi.publish(template.id)),
    onSettled: () => queryClient.invalidateQueries({ queryKey: adminKeys.templates() }),
  });

  return (
    <tr className="border-b border-line last:border-0 hover:bg-white/3">
      <Td>
        <Link
          href={`/admin/templates/${template.id}`}
          className="text-[14px] font-medium text-ink hover:underline"
        >
          {template.title}
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[11px] text-ink-faint">/{template.slug}</span>
          <Badge>{template.contentType === "VIDEO" ? "영상" : "이미지"}</Badge>
          {missing.map((part) => (
            <Badge key={part} tone="warn">
              {part} 없음
            </Badge>
          ))}
        </div>
      </Td>

      <Td>
        <AccessCell
          access={template.promptAccess}
          cost={template.promptCost}
          hiddenLabel="비공개"
        />
      </Td>

      <Td>
        <AccessCell access={template.generateAccess} cost={template.generateCost} />
      </Td>

      <Td className="text-right font-mono text-[13px] text-ink-soft">
        {template.generationCount.toLocaleString()}
      </Td>

      <Td>
        <Badge tone={live ? "good" : "neutral"}>
          {live ? "공개 중" : template.status === "DRAFT" ? "작성 중" : "숨김"}
        </Badge>
      </Td>

      <Td>
        <Button
          variant="secondary"
          size="sm"
          disabled={toggle.isPending || (!live && missing.length > 0)}
          title={!live && missing.length > 0 ? `${missing.join(" · ")}을(를) 먼저 채워주세요` : undefined}
          onClick={() => toggle.mutate()}
        >
          {toggle.isPending ? "…" : live ? "내리기" : "공개"}
        </Button>
      </Td>
    </tr>
  );
}

function AccessCell({
  access,
  cost,
  hiddenLabel,
}: {
  access: "FREE" | "PAID" | "HIDDEN";
  cost: number;
  hiddenLabel?: string;
}) {
  if (access === "HIDDEN") {
    return <span className="text-[13px] text-ink-faint">{hiddenLabel ?? "-"}</span>;
  }
  if (access === "FREE") {
    return <span className="text-[13px] font-medium text-accent">무료</span>;
  }
  return <span className="font-mono text-[13px] text-paid">{cost.toLocaleString()}</span>;
}

function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn("px-4 py-2.5 font-medium whitespace-nowrap", className)}>{children}</th>;
}

function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top whitespace-nowrap", className)}>{children}</td>;
}
