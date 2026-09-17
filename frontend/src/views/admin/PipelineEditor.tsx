"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import { STEP_TYPES, type AiModel, type PipelineDraftStep } from "@/entities/admin/model/types";
import { ApiError } from "@/shared/api/client";
import { cn } from "@/shared/lib/cn";

/**
 * 파이프라인 편집기.
 *
 * 템플릿마다 쓰는 AI가 다르다. 어떤 건 Gemini로 사진을 읽고, GPT로 장면을 만들고,
 * Higgsfield로 영상화한다. 여기서 그 순서와 모델을 정한다.
 *
 * 사용자 화면에는 이 내용이 전혀 나가지 않는다. 사용자는 "영상 만드는 중" 정도만 본다.
 */
export function PipelineEditor({ templateId }: { templateId: number }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<PipelineDraftStep[] | null>(null);
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 꺼둔 모델까지 받아온다. 이미 고른 모델이 꺼져 있어도 화면에서 사라지지 않게 하기 위해서다.
  const { data: models } = useQuery({
    queryKey: adminKeys.models(),
    queryFn: () => adminApi.modelsAll(),
  });

  const { data: pipelines } = useQuery({
    queryKey: adminKeys.pipelines(templateId),
    queryFn: () => adminApi.pipelines(templateId),
  });

  const active = pipelines?.find((p) => p.active);
  const steps =
    draft ??
    active?.steps.map((s) => ({
      type: s.type,
      modelId: s.modelId,
      prompt: s.prompt ?? "",
      params: s.params,
      inputs: s.inputs,
    })) ??
    [];

  const save = useMutation({
    mutationFn: () =>
      adminApi.savePipeline(templateId, {
        steps,
        adminMemo: memo || active?.adminMemo || null,
        activate: true,
      }),
    onSuccess: () => {
      setDraft(null);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: adminKeys.pipelines(templateId) });
      void queryClient.invalidateQueries({ queryKey: adminKeys.template(templateId) });
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : "저장하지 못했어요."),
  });

  function edit(index: number, patch: Partial<PipelineDraftStep>) {
    setDraft(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  function addStep() {
    setDraft([
      ...steps,
      { type: "GENERATE_IMAGE", modelId: null, prompt: "", params: {}, inputs: {} },
    ]);
  }

  function removeStep(index: number) {
    setDraft(steps.filter((_, i) => i !== index));
  }

  function move(index: number, delta: number) {
    const next = [...steps];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(next);
  }

  const totalCost = steps.reduce((sum, step) => {
    const model = models?.find((m) => m.id === step.modelId);
    return sum + (model?.unitCostKrw ?? 0);
  }, 0);

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-[16px] font-semibold text-ink">제작 방법</h2>
          <p className="mt-0.5 text-[12px] text-ink-soft">
            단계마다 어떤 AI를 쓸지 정해요. 사용자에게는 보이지 않아요.
          </p>
        </div>
        <div className="text-[12px] text-ink-soft">
          {active ? `버전 ${active.version} 사용 중` : "아직 없음"}
          <span className="ml-3 text-ink">1회 원가 약 {totalCost.toLocaleString()}원</span>
        </div>
      </header>

      <ol className="space-y-3">
        {steps.map((step, index) => (
          <StepCard
            key={index}
            index={index}
            step={step}
            models={models ?? []}
            isLast={index === steps.length - 1}
            onChange={(patch) => edit(index, patch)}
            onRemove={() => removeStep(index)}
            onMove={(delta) => move(index, delta)}
          />
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={addStep}
          className="rounded-sm border border-line px-3 py-1.5 text-[13px] text-ink"
        >
          단계 추가
        </button>
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={steps.length === 0 || save.isPending}
          className="rounded-sm bg-ink px-3 py-1.5 text-[13px] font-medium text-ground disabled:opacity-40"
        >
          {save.isPending ? "저장 중" : "새 버전으로 저장"}
        </button>
        {draft && (
          <button
            type="button"
            onClick={() => setDraft(null)}
            className="text-[13px] text-ink-soft"
          >
            되돌리기
          </button>
        )}
      </div>

      {error && <p className="text-[13px] text-[#b0413e]">{error}</p>}

      <div className="space-y-1.5">
        <label className="block text-[12px] text-ink-soft">
          메모 (참고한 원본 링크, 주의할 점)
        </label>
        <input
          value={memo || active?.adminMemo || ""}
          onChange={(e) => setMemo(e.target.value)}
          className="w-full border border-line bg-ground-raised px-2.5 py-1.5 text-[13px]"
        />
      </div>

      {pipelines && pipelines.length > 1 && (
        <details className="text-[13px]">
          <summary className="cursor-pointer text-ink-soft">
            이전 버전 {pipelines.length - 1}개
          </summary>
          <ul className="mt-2 space-y-1.5">
            {pipelines
              .filter((p) => !p.active)
              .map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="text-ink-soft">
                    버전 {p.version} · 단계 {p.steps.length}개 · {p.estimatedCostKrw}원
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      adminApi.activatePipeline(templateId, p.id).then(() => {
                        setDraft(null);
                        void queryClient.invalidateQueries({
                          queryKey: adminKeys.pipelines(templateId),
                        });
                      })
                    }
                    className="text-ink underline"
                  >
                    이 버전으로 되돌리기
                  </button>
                </li>
              ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function StepCard({
  index,
  step,
  models,
  isLast,
  onChange,
  onRemove,
  onMove,
}: {
  index: number;
  step: PipelineDraftStep;
  models: AiModel[];
  isLast: boolean;
  onChange: (patch: Partial<PipelineDraftStep>) => void;
  onRemove: () => void;
  onMove: (delta: number) => void;
}) {
  const stepType = STEP_TYPES.find((t) => t.value === step.type);

  // 단계 유형에 맞는 모델만 후보로 보여준다. 영상 단계에 텍스트 모델을 고를 이유가 없다.
  const selected = models.find((m) => m.id === step.modelId);
  const fitting = models.filter((m) => m.capability === stepType?.capability && m.active);

  // 이미 고른 모델이 꺼져 있거나 단계 유형과 맞지 않아도 목록에 남겨 둔다.
  // 목록에서 빠지면 선택이 사라진 것처럼 보여, 저장할 때 조용히 다른 모델로 바뀔 수 있다.
  const candidates =
    selected && !fitting.some((m) => m.id === selected.id) ? [selected, ...fitting] : fitting;

  return (
    <li className="border border-line bg-ground-raised">
      <div className="flex items-center gap-2 border-b border-line px-3 py-2">
        <span className="text-[12px] text-ink-faint">{index + 1}</span>

        <select
          value={step.type}
          onChange={(e) => onChange({ type: e.target.value, modelId: null })}
          className="border border-line bg-ground px-2 py-1 text-[13px]"
        >
          {STEP_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>

        <select
          value={step.modelId ?? ""}
          onChange={(e) => onChange({ modelId: e.target.value ? Number(e.target.value) : null })}
          className={cn(
            "border bg-ground px-2 py-1 text-[13px]",
            step.modelId ? "border-line" : "border-[#b0413e] text-[#b0413e]",
          )}
        >
          <option value="">어떤 AI를 쓸까요</option>
          {candidates.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName} ({m.provider}) · {m.unitCostKrw}원
              {!m.active ? " · 꺼짐" : ""}
              {m.capability !== stepType?.capability ? " · 이 단계와 안 맞음" : ""}
            </option>
          ))}
        </select>

        {selected && !selected.active && (
          <span className="text-[12px] text-paid">
            이 모델은 꺼져 있어요. 켜야 제작이 돌아가요
          </span>
        )}

        <div className="ml-auto flex items-center gap-1 text-[12px] text-ink-soft">
          {index > 0 && (
            <button type="button" onClick={() => onMove(-1)} aria-label="위로">
              ↑
            </button>
          )}
          {!isLast && (
            <button type="button" onClick={() => onMove(1)} aria-label="아래로">
              ↓
            </button>
          )}
          <button type="button" onClick={onRemove} className="ml-1" aria-label="삭제">
            삭제
          </button>
        </div>
      </div>

      <div className="space-y-2.5 px-3 py-3">
        {selected?.memo && <p className="text-[12px] text-ink-faint">{selected.memo}</p>}

        <div>
          <label className="mb-1 block text-[12px] text-ink-soft">
            이 단계에 넣을 프롬프트 — {"{{입력필드키}}"}로 사용자 입력을 끼워 넣어요
          </label>
          <textarea
            value={step.prompt}
            onChange={(e) => onChange({ prompt: e.target.value })}
            rows={3}
            className="w-full border border-line bg-ground px-2.5 py-2 font-mono text-[12.5px] leading-relaxed"
          />
        </div>

        {selected && Object.keys(selected.paramSchema).length > 0 && (
          <div className="flex flex-wrap gap-3">
            {Object.entries(selected.paramSchema).map(([key, spec]) => (
              <label key={key} className="text-[12px] text-ink-soft">
                <span className="mr-1.5">{key}</span>
                {spec.type === "select" ? (
                  <select
                    value={String(step.params[key] ?? "")}
                    onChange={(e) => onChange({ params: { ...step.params, [key]: e.target.value } })}
                    className="border border-line bg-ground px-1.5 py-1 text-[12px]"
                  >
                    <option value="">기본값</option>
                    {spec.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={spec.type === "number" ? "number" : "text"}
                    min={spec.min}
                    max={spec.max}
                    value={String(step.params[key] ?? "")}
                    onChange={(e) =>
                      onChange({
                        params: {
                          ...step.params,
                          [key]:
                            spec.type === "number" ? Number(e.target.value) : e.target.value,
                        },
                      })
                    }
                    className="w-20 border border-line bg-ground px-1.5 py-1 text-[12px]"
                  />
                )}
              </label>
            ))}
          </div>
        )}

        <div>
          <label className="mb-1 block text-[12px] text-ink-soft">
            앞 단계 결과 연결 — 예: {`{"image": "steps[0].output"}`}
          </label>
          <input
            value={JSON.stringify(step.inputs)}
            onChange={(e) => {
              try {
                onChange({ inputs: JSON.parse(e.target.value) });
              } catch {
                // 입력하는 중에는 JSON이 깨져 있는 게 정상이다. 완성되면 반영된다.
              }
            }}
            className="w-full border border-line bg-ground px-2.5 py-1.5 font-mono text-[12px]"
          />
        </div>
      </div>
    </li>
  );
}
