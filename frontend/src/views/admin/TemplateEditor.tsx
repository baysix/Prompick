"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import {
  EMPTY_TEMPLATE_FORM,
  toFormValues,
  type TemplateFormValues,
} from "@/entities/admin/model/types";
import { templateApi, templateKeys } from "@/entities/template/api/templateApi";
import { ApiError } from "@/shared/api/client";
import { ExposureWarning } from "./ExposureWarning";
import { MediaEditor } from "./MediaEditor";
import { PipelineEditor } from "./PipelineEditor";
import { PublicPromptEditor } from "./PublicPromptEditor";

/**
 * 템플릿 편집기.
 *
 * 프롬프트 제공 방식과 제작 방식을 따로 정한다. 이 조합이 이 서비스의 상품 구조 그 자체다.
 */
export function TemplateEditor({ templateId }: { templateId: number | null }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isNew = templateId === null;
  const [error, setError] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: templateKeys.categories(),
    queryFn: () => templateApi.categories(),
  });

  const { data: existing } = useQuery({
    queryKey: adminKeys.template(templateId ?? 0),
    queryFn: () => adminApi.template(templateId!),
    enabled: !isNew,
  });

  const [form, setForm] = useState<TemplateFormValues | null>(null);
  const value = form ?? (existing ? toFormValues(existing) : EMPTY_TEMPLATE_FORM);

  function set(patch: Partial<TemplateFormValues>) {
    setForm({ ...value, ...patch });
  }

  const save = useMutation({
    mutationFn: () =>
      isNew ? adminApi.createTemplate(value) : adminApi.updateTemplate(templateId, value),
    onSuccess: (saved) => {
      setError(null);
      setForm(null);
      void queryClient.invalidateQueries({ queryKey: adminKeys.templates() });
      void queryClient.invalidateQueries({ queryKey: adminKeys.template(saved.id) });
      if (isNew) router.replace(`/admin/templates/${saved.id}`);
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "저장하지 못했어요."),
  });

  const publish = useMutation({
    mutationFn: () =>
      existing?.status === "PUBLISHED"
        ? adminApi.unpublish(templateId!)
        : adminApi.publish(templateId!),
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({ queryKey: adminKeys.template(templateId!) });
      void queryClient.invalidateQueries({ queryKey: adminKeys.templates() });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "처리하지 못했어요."),
  });

  const { promptAccess, generateAccess } = value;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header className="flex items-center justify-between gap-3">
        <h2 className="text-[18px] font-semibold text-ink">
          {isNew ? "새 템플릿" : existing?.title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="bg-brand rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-accent-ink disabled:opacity-40"
          >
            {save.isPending ? "저장 중" : "저장"}
          </button>
          {!isNew && (
            <button
              type="button"
              onClick={() => publish.mutate()}
              className="rounded-full border border-line px-3.5 py-1.5 text-[13px] text-ink"
            >
              {existing?.status === "PUBLISHED" ? "내리기" : "게시하기"}
            </button>
          )}
        </div>
      </header>

      {error && (
        <p className="border-l-2 border-[#ff6b6b] pl-3 text-[13px] text-[#ff6b6b]">{error}</p>
      )}

      <ExposureWarning value={value} />

      <section className="space-y-4">
        <h2 className="text-[16px] font-semibold text-ink">기본 정보</h2>

        <Field label="제목">
          <input
            value={value.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="공중에 뜬 제품 광고"
            className={inputClass}
          />
        </Field>

        <Field label="주소" hint="영문 소문자와 하이픈만. 나중에 바꾸면 기존 링크가 깨져요">
          <input
            value={value.slug}
            onChange={(e) => set({ slug: e.target.value })}
            placeholder="floating-product-ad"
            className={`${inputClass} font-mono`}
          />
        </Field>

        <Field label="설명">
          <textarea
            value={value.description}
            onChange={(e) => set({ description: e.target.value })}
            rows={2}
            className={inputClass}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="종류">
            <select
              value={value.contentType}
              onChange={(e) => set({ contentType: e.target.value as TemplateFormValues["contentType"] })}
              className={inputClass}
            >
              <option value="VIDEO">영상</option>
              <option value="IMAGE">이미지</option>
            </select>
          </Field>

          <Field label="주제">
            <select
              value={value.categorySlug}
              onChange={(e) => set({ categorySlug: e.target.value })}
              className={inputClass}
            >
              <option value="">고르기</option>
              {categories?.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-[16px] font-semibold text-ink">어떻게 팔까요</h2>
          <p className="mt-0.5 text-[12px] text-ink-soft">
            프롬프트 제공과 자동 제작은 별개예요. 각각 따로 정해요.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="프롬프트 제공">
            <select
              value={promptAccess}
              onChange={(e) => set({ promptAccess: e.target.value as TemplateFormValues["promptAccess"] })}
              className={inputClass}
            >
              <option value="HIDDEN">제공하지 않음 (여기서만 제작)</option>
              <option value="FREE">로그인하면 공개</option>
              <option value="PAID">프롬비를 내면 공개</option>
            </select>
            {promptAccess === "PAID" && (
              <input
                type="number"
                min={1}
                value={value.promptCost}
                onChange={(e) => set({ promptCost: Number(e.target.value) })}
                className={`${inputClass} mt-2`}
              />
            )}
          </Field>

          <Field label="자동 제작">
            <select
              value={generateAccess}
              onChange={(e) => set({ generateAccess: e.target.value as TemplateFormValues["generateAccess"] })}
              className={inputClass}
            >
              <option value="PAID">프롬비를 내고 제작</option>
              <option value="FREE">하루 무료 횟수로 제작</option>
            </select>
            {generateAccess === "PAID" && (
              <input
                type="number"
                min={1}
                value={value.generateCost}
                onChange={(e) => set({ generateCost: Number(e.target.value) })}
                className={`${inputClass} mt-2`}
              />
            )}
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-[16px] font-semibold text-ink">결과물</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="비율">
            <select
              value={value.ratio}
              onChange={(e) => set({ ratio: e.target.value })}
              className={inputClass}
            >
              <option value="9:16">9:16 세로</option>
              <option value="1:1">1:1 정사각</option>
              <option value="16:9">16:9 가로</option>
            </select>
          </Field>
          <Field label="길이(초)">
            <input
              type="number"
              value={value.durationSeconds ?? ""}
              onChange={(e) =>
                set({ durationSeconds: e.target.value ? Number(e.target.value) : null })
              }
              className={inputClass}
            />
          </Field>
          <Field label="예상 소요(초)">
            <input
              type="number"
              value={value.estimatedSeconds}
              onChange={(e) => set({ estimatedSeconds: Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="필요한 사진" hint="카드와 상세에 그대로 보여요">
          <input
            value={value.requiredPhotoSummary}
            onChange={(e) => set({ requiredPhotoSummary: e.target.value })}
            placeholder="제품 사진 1장"
            className={inputClass}
          />
        </Field>
      </section>

      {!isNew && (
        <>
          <MediaEditor templateId={templateId} />
          {promptAccess !== "HIDDEN" && <PublicPromptEditor templateId={templateId} />}
          <PipelineEditor templateId={templateId} />
        </>
      )}

      {isNew && (
        <p className="border-l-2 border-line pl-3 text-[13px] text-ink-soft">
          먼저 저장하면 프롬프트 원문과 제작 방법을 등록할 수 있어요.
        </p>
      )}
    </div>
  );
}

const inputClass = "w-full border border-line bg-surface px-2.5 py-1.5 text-[13px] text-ink";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[12px] text-ink-soft">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-ink-faint">{hint}</p>}
    </div>
  );
}
