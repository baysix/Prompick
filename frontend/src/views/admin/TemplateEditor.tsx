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
import { ReferenceVideoEditor } from "./ReferenceVideoEditor";

/**
 * 템플릿 편집.
 *
 * 한 템플릿에는 성격이 다른 덩어리들이 붙는다. 한 화면에 세로로 쌓으면 스크롤만 길어지고
 * 무엇이 빠졌는지 안 보여서 탭으로 나눈다.
 *
 * <p>이미지와 영상은 만드는 방식이 달라서 탭 구성도 다르다.
 *
 * <pre>
 * 이미지   기본 정보 · 파이프라인 · 예시
 * 영상     기본 정보 · 레퍼런스 영상 · 파이프라인
 * </pre>
 *
 * <p>공개 프롬프트 탭은 없다. 사용자에게 보여줄 프롬프트는 파이프라인의 지시문 그대로이고,
 * 공개할지 말지는 기본 정보의 요금 설정이 정한다. 예전에는 공개용 원문을 따로 적게 했는데,
 * 같아야 한다는 것을 지켜주는 장치가 없어 며칠 만에 어긋났다 — 사용자는 그동안 실제로 쓰이지
 * 않는 프롬프트를 복사해 갔다.
 *
 * <p>영상에 예시 탭이 없는 이유: 레퍼런스 영상이 곧 예시다. "이 영상에 네 얼굴을 넣어준다"가
 * 이 템플릿의 설명 전부라, 같은 영상을 예시로 한 번 더 올리게 하는 것은 같은 일을 두 번
 * 시키는 것이다.
 *
 * <p>이미지에 레퍼런스 영상이 없는 이유: 바탕으로 쓸 영상이 없다. 사진에서 새로 그린다.
 *
 * 새 템플릿은 종류부터 고른다. 그 선택이 탭 구성과 준비할 것을 통째로 바꾸는데, 폼 중간의
 * 드롭다운에 묻어두면 다 적고 나서야 엉뚱한 것을 만들고 있었음을 알게 된다.
 *
 * 그다음 기본 정보를 저장해야 나머지 탭이 열린다. 전부 템플릿 id에 매달리기 때문이다.
 */
type Tab = "basic" | "reference" | "pipeline" | "media";

/** 쓰는 결과물 비율 */
const RATIOS = ["9:16", "2:3", "3:4", "4:5", "1:1", "16:9"];

export function TemplateEditor({ templateId }: { templateId: number | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("basic");
  // 새 템플릿에서만 쓴다. 고르기 전에는 나머지 화면을 보여주지 않는다.
  const [picked, setPicked] = useState<ContentType | null>(null);
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

  if (templateId === null && picked === null) {
    return <TypePicker onPick={(type) => {
      setPicked(type);
      setDraft({
        ...EMPTY_TEMPLATE_FORM,
        contentType: type,
        // 영상은 프롬프트를 팔 수 없다. 레퍼런스 영상 없이는 그 지시문이 아무 쓸모가 없다.
        promptAccess: type === "VIDEO" ? "HIDDEN" : EMPTY_TEMPLATE_FORM.promptAccess,
      });
    }} />;
  }

  const form = draft ?? (template ? toFormValues(template) : EMPTY_TEMPLATE_FORM);
  const set = (patch: Partial<TemplateFormValues>) => setDraft({ ...form, ...patch });

  const isVideo = form.contentType === "VIDEO";

  // 영상은 레퍼런스 영상이 곧 예시다. 같은 영상을 예시로 한 번 더 올리게 하지 않는다.
  const TABS: { key: Tab; label: string; ready?: boolean }[] = isVideo
    ? [
        { key: "basic", label: "기본 정보" },
        { key: "reference", label: "레퍼런스 영상", ready: template?.hasReferenceVideo },
        { key: "pipeline", label: "파이프라인", ready: template?.hasActivePipeline },
      ]
    : [
        { key: "basic", label: "기본 정보" },
        { key: "pipeline", label: "파이프라인", ready: template?.hasActivePipeline },
        { key: "media", label: "예시", ready: (template?.mediaCount ?? 0) > 0 },
      ];

  // 종류를 바꾸면 없던 탭이 생기고 있던 탭이 사라진다. 사라진 탭에 남아 있으면
  // 화면이 비어버리므로 기본 정보로 돌려보낸다.
  const visible = TABS.some((t) => t.key === tab);
  const current = visible ? tab : "basic";

  return (
    <div className="max-w-4xl space-y-5">
      {template && (
        <ExposureWarning
          template={template}
          templateId={current === "basic" ? null : template.id}
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
                current === t.key
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

      {current === "basic" && (
        <BasicForm
          form={form}
          set={set}
          dirty={draft !== null}
          saving={save.isPending}
          error={error}
          onSave={() => save.mutate(form)}
        />
      )}

      {current === "reference" && templateId !== null && (
        <ReferenceVideoEditor templateId={templateId} />
      )}

      {current === "pipeline" && templateId !== null && <PipelineEditor templateId={templateId} />}

      {current === "media" && templateId !== null && <MediaEditor templateId={templateId} />}
    </div>
  );
}

/**
 * 무엇을 만드는 템플릿인가.
 *
 * 이름만 고르게 하지 않고 준비물을 함께 적는다. 종류에 따라 미리 있어야 하는 것이 다른데,
 * 그것을 모르고 시작하면 절반쯤 적다가 멈추게 된다.
 */
function TypePicker({ onPick }: { onPick: (type: ContentType) => void }) {
  const options: {
    type: ContentType;
    label: string;
    summary: string;
    needs: string[];
  }[] = [
    {
      type: "IMAGE",
      label: "이미지",
      summary: "사용자가 올린 사진으로 그림을 새로 만들어요.",
      needs: ["지시문", "예시 결과물", "(원하면) 사용자에게 줄 프롬프트"],
    },
    {
      type: "VIDEO",
      label: "영상",
      summary: "이미 찍힌 영상에서 인물이나 배경만 갈아 끼워요.",
      needs: ["레퍼런스 영상", "목록에서 재생할 가벼운 영상", "무엇을 바꿀지 적은 지시문"],
    },
  ];

  return (
    <Card
      title="무엇을 만드는 템플릿인가요"
      description="고른 뒤에는 바꿀 수 있지만, 준비할 것이 달라서 먼저 정하는 편이 좋아요."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.type}
            type="button"
            onClick={() => onPick(option.type)}
            className="rounded-xl border border-line p-5 text-left transition-colors hover:border-ink-faint hover:bg-white/3"
          >
            <p className="text-[16px] font-semibold text-ink">{option.label}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{option.summary}</p>

            <p className="mt-4 text-[12px] text-ink-faint">필요한 것</p>
            <ul className="mt-1 space-y-0.5">
              {option.needs.map((need) => (
                <li key={need} className="text-[13px] text-ink-soft">
                  · {need}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </Card>
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
