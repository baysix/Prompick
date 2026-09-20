"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import {
  EMPTY_TEMPLATE_FORM,
  toFormValues,
  type AdminTemplate,
  type TemplateFormValues,
} from "@/entities/admin/model/types";
import type { ContentType, GenerateAccess, PromptAccess } from "@/entities/template/model/types";
import { ApiError } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Card, Field, Input, Select, Textarea, Toggle } from "@/widgets/admin-shell/Card";
import { ExposureWarning } from "./ExposureWarning";
import { MediaEditor } from "./MediaEditor";
import { PipelineEditor } from "./PipelineEditor";
import { PublicPromptEditor } from "./PublicPromptEditor";

/**
 * 템플릿 편집.
 *
 * 한 템플릿에는 성격이 다른 네 덩어리가 붙는다 — 설명과 요금, 사용자에게 줄 프롬프트,
 * 우리가 돌릴 파이프라인, 예시 결과물. 한 화면에 세로로 쌓으면 스크롤만 길어지고
 * 무엇이 빠졌는지 안 보여서 탭으로 나눈다.
 *
 * 새 템플릿은 기본 정보부터 저장해야 한다. 나머지 셋은 모두 템플릿 id에 매달리기 때문이다.
 */
type Tab = "basic" | "prompt" | "pipeline" | "media";

/** 쓰는 결과물 비율 */
const RATIOS = ["9:16", "2:3", "3:4", "4:5", "1:1", "16:9"];

export function TemplateEditor({ templateId }: { templateId: number | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("basic");
  const [draft, setDraft] = useState<TemplateFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: template, isPending } = useQuery({
    queryKey: adminKeys.template(templateId ?? 0),
    queryFn: () => adminApi.template(templateId as number),
    enabled: templateId !== null,
  });

  const save = useMutation({
    mutationFn: (form: TemplateFormValues) =>
      templateId === null
        ? adminApi.createTemplate(form)
        : adminApi.updateTemplate(templateId, form),
    onSuccess: (saved: AdminTemplate) => {
      setDraft(null);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: adminKeys.templates() });
      if (templateId === null) router.replace(`/admin/templates/${saved.id}`);
      else void queryClient.invalidateQueries({ queryKey: adminKeys.template(templateId) });
    },
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : "저장하지 못했어요. 값을 확인해주세요."),
  });

  if (templateId !== null && isPending) {
    return <p className="text-[13px] text-ink-faint">불러오는 중</p>;
  }

  const form = draft ?? (template ? toFormValues(template) : EMPTY_TEMPLATE_FORM);
  const set = (patch: Partial<TemplateFormValues>) => setDraft({ ...form, ...patch });

  const TABS: { key: Tab; label: string; ready?: boolean }[] = [
    { key: "basic", label: "기본 정보" },
    { key: "prompt", label: "공개 프롬프트", ready: template?.hasPublicPrompt },
    { key: "pipeline", label: "파이프라인", ready: template?.hasActivePipeline },
    { key: "media", label: "예시", ready: (template?.mediaCount ?? 0) > 0 },
  ];

  return (
    <div className="max-w-4xl space-y-5">
      {template && (
        <ExposureWarning
          template={template}
          templateId={tab === "basic" ? null : template.id}
        />
      )}

      <nav className="flex gap-1 border-b border-line">
        {TABS.map((t) => {
          const locked = templateId === null && t.key !== "basic";
          return (
            <button
              key={t.key}
              type="button"
              disabled={locked}
              onClick={() => setTab(t.key)}
              title={locked ? "기본 정보를 먼저 저장해주세요" : undefined}
              className={cn(
                "-mb-px flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-[14px] transition-colors",
                tab === t.key
                  ? "border-accent font-semibold text-ink"
                  : "border-transparent text-ink-soft hover:text-ink",
                locked && "opacity-40",
              )}
            >
              {t.label}
              {t.key !== "basic" && !locked && (
                <span
                  className={cn("h-1.5 w-1.5 rounded-full", t.ready ? "bg-accent" : "bg-paid")}
                  aria-label={t.ready ? "채워짐" : "비어 있음"}
                />
              )}
            </button>
          );
        })}
      </nav>

      {tab === "basic" && (
        <BasicForm
          form={form}
          set={set}
          dirty={draft !== null}
          saving={save.isPending}
          error={error}
          onSave={() => save.mutate(form)}
        />
      )}

      {tab === "prompt" && templateId !== null && (
        <PublicPromptEditor templateId={templateId} promptAccess={form.promptAccess} />
      )}

      {tab === "pipeline" && templateId !== null && <PipelineEditor templateId={templateId} />}

      {tab === "media" && templateId !== null && <MediaEditor templateId={templateId} />}
    </div>
  );
}

function BasicForm({
  form,
  set,
  dirty,
  saving,
  error,
  onSave,
}: {
  form: TemplateFormValues;
  set: (patch: Partial<TemplateFormValues>) => void;
  dirty: boolean;
  saving: boolean;
  error: string | null;
  onSave: () => void;
}) {
  const isVideo = form.contentType === "VIDEO";

  return (
    <div className="space-y-5">
      <Card
        title="무엇을 만드는 템플릿인가"
        actions={
          <Button size="sm" disabled={saving || !dirty} onClick={onSave}>
            {saving ? "저장 중" : "저장"}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="제목" required hint="사용자가 목록에서 읽는 이름">
              <Input value={form.title} onChange={(e) => set({ title: e.target.value })} />
            </Field>

            <Field label="주소" required hint="/t/여기 — 공개한 뒤에는 바꾸지 마세요">
              <Input
                value={form.slug}
                onChange={(e) => set({ slug: e.target.value.replace(/[^a-z0-9-]/g, "") })}
                className="font-mono"
                placeholder="retro-film-portrait"
              />
            </Field>
          </div>

          <Field label="설명" hint="어떤 느낌의 결과가 나오는지 한두 줄로">
            <Textarea
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              rows={2}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="종류" required>
              <Select
                value={form.contentType}
                onChange={(e) => set({ contentType: e.target.value as ContentType })}
              >
                <option value="VIDEO">영상</option>
                <option value="IMAGE">이미지</option>
              </Select>
            </Field>

            <Field label="비율">
              <Select value={form.ratio} onChange={(e) => set({ ratio: e.target.value })}>
                {/*
                  목록에 없는 비율을 가진 템플릿을 이 폼으로 열어 저장하면 원래 값이 조용히
                  덮인다. 실제로 그 일이 한 번 일어났으므로, 쓰는 비율은 빠짐없이 둔다.
                */}
                {RATIOS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                {!RATIOS.includes(form.ratio) && form.ratio && (
                  // 목록에 없는 값이 이미 들어 있으면 그대로 보여준다. 모르는 값을 감추면
                  // 저장하는 순간 사라진다.
                  <option value={form.ratio}>{form.ratio}</option>
                )}
              </Select>
            </Field>

            <Field label="예상 소요" hint="초. 사용자에게 대기 시간으로 보여요">
              <Input
                type="number"
                value={form.estimatedSeconds}
                onChange={(e) => set({ estimatedSeconds: Number(e.target.value) })}
              />
            </Field>
          </div>

          {isVideo && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="길이" hint="초">
                <Input
                  type="number"
                  value={form.durationSeconds ?? ""}
                  onChange={(e) =>
                    set({ durationSeconds: e.target.value ? Number(e.target.value) : null })
                  }
                />
              </Field>
              <Field label="해상도">
                <Input
                  value={form.resolution ?? ""}
                  onChange={(e) => set({ resolution: e.target.value || null })}
                  className="font-mono"
                  placeholder="1080x1920"
                />
              </Field>
            </div>
          )}
        </div>
      </Card>

      <Card
        title="요금"
        description="프롬프트를 받아 가는 것과 대신 만들어 주는 것은 따로 값을 매겨요. 하나만 열어도 돼요."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Field label="프롬프트 원문">
              <Select
                value={form.promptAccess}
                onChange={(e) => set({ promptAccess: e.target.value as PromptAccess })}
              >
                <option value="HIDDEN">공개하지 않음</option>
                <option value="FREE">누구나 무료로</option>
                <option value="PAID">프롬비를 받고</option>
              </Select>
            </Field>
            {form.promptAccess === "PAID" && (
              <div className="mt-3">
                <Field label="프롬비">
                  <Input
                    type="number"
                    value={form.promptCost}
                    onChange={(e) => set({ promptCost: Number(e.target.value) })}
                    className="font-mono"
                  />
                </Field>
              </div>
            )}
          </div>

          <div>
            <Field label="대신 만들어 주기">
              <Select
                value={form.generateAccess}
                onChange={(e) => set({ generateAccess: e.target.value as GenerateAccess })}
              >
                <option value="PAID">프롬비를 받고</option>
                <option value="FREE">무료로 (하루 횟수 제한)</option>
              </Select>
            </Field>
            {form.generateAccess === "PAID" && (
              <div className="mt-3">
                <Field label="프롬비" hint="파이프라인 원가보다 높게 잡아야 남아요">
                  <Input
                    type="number"
                    value={form.generateCost}
                    onChange={(e) => set({ generateCost: Number(e.target.value) })}
                    className="font-mono"
                  />
                </Field>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card
        title="사진 안내"
        description="어떤 사진을 올려야 잘 나오는지 미리 알려주면 실패와 환불 문의가 크게 줄어요."
      >
        <div className="space-y-4">
          <Field label="한 줄 요약" hint="목록과 상세에서 먼저 보여요">
            <Input
              value={form.requiredPhotoSummary}
              onChange={(e) => set({ requiredPhotoSummary: e.target.value })}
              placeholder="정면 얼굴 사진 한 장"
            />
          </Field>

          <Field label="확인할 것" hint="한 줄에 하나씩. 업로드 화면에 체크리스트로 보여요">
            <Textarea
              value={(form.uploadGuide.checklist ?? []).join("\n")}
              onChange={(e) =>
                set({
                  uploadGuide: {
                    ...form.uploadGuide,
                    checklist: e.target.value.split("\n").filter((line) => line.trim() !== ""),
                  },
                })
              }
              rows={4}
              placeholder={"얼굴이 정면으로 나온 사진\n너무 어둡지 않은 사진"}
            />
          </Field>

          <Field label="결과 안내" hint="결과가 어떻게 달라질 수 있는지 미리 말해두는 자리">
            <Input
              value={form.uploadGuide.resultNote ?? ""}
              onChange={(e) =>
                set({ uploadGuide: { ...form.uploadGuide, resultNote: e.target.value } })
              }
              placeholder="사진에 따라 분위기가 조금씩 달라져요."
            />
          </Field>

          <Field label="태그" hint="쉼표로 구분. 검색에 쓰여요">
            <Input
              value={form.tags.join(", ")}
              onChange={(e) =>
                set({
                  tags: e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
            />
          </Field>

          <Toggle
            checked={form.pinned}
            onChange={(pinned) => set({ pinned })}
            label="홈 위쪽에 고정"
          />
        </div>
      </Card>

      {error && <p className="text-[13px] text-paid">{error}</p>}
    </div>
  );
}
