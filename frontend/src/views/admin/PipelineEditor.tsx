"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import {
  STEP_TYPES,
  type AiModel,
  type Pipeline,
  type PipelineDraftStep,
} from "@/entities/admin/model/types";
import { Button } from "@/shared/ui/Button";
import { Badge, Card, Field, Input, Select, Textarea, Toggle } from "@/widgets/admin-shell/Card";

/**
 * 실행 파이프라인.
 *
 * 사용자가 "만들기"를 눌렀을 때 서버가 밟는 단계들이다. 단계마다 다른 회사의 모델을 써도 되고,
 * 사용자는 그 사실을 알 수 없다 — 이 값들은 어떤 사용자 API 응답에도 실리지 않는다.
 *
 * 저장하면 항상 새 버전이 된다. 돌아가는 파이프라인을 고치다 망가뜨리면 이미 결제한 사용자가
 * 바로 피해를 보기 때문에, 예전 버전을 남겨두고 언제든 되돌릴 수 있게 한다.
 */
const EMPTY_STEP: PipelineDraftStep = {
  type: "GENERATE_IMAGE",
  modelId: null,
  prompt: "",
  params: {},
  inputs: {},
};

export function PipelineEditor({ templateId }: { templateId: number }) {
  const queryClient = useQueryClient();
  const [steps, setSteps] = useState<PipelineDraftStep[] | null>(null);
  const [memo, setMemo] = useState<string | null>(null);
  const [activate, setActivate] = useState(true);

  const { data: pipelines, isPending } = useQuery({
    queryKey: adminKeys.pipelines(templateId),
    queryFn: () => adminApi.pipelines(templateId),
  });

  const { data: models } = useQuery({
    queryKey: adminKeys.models(),
    queryFn: () => adminApi.models(),
  });

  const active = pipelines?.find((p) => p.active) ?? null;

  const save = useMutation({
    mutationFn: (body: { steps: PipelineDraftStep[]; adminMemo: string | null; activate: boolean }) =>
      adminApi.savePipeline(templateId, body),
    onSuccess: () => {
      setSteps(null);
      setMemo(null);
      void queryClient.invalidateQueries({ queryKey: adminKeys.pipelines(templateId) });
      void queryClient.invalidateQueries({ queryKey: adminKeys.templates() });
    },
  });

  const activateOld = useMutation({
    mutationFn: (pipelineId: number) => adminApi.activatePipeline(templateId, pipelineId),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: adminKeys.pipelines(templateId) }),
  });

  if (isPending) return <Card title="실행 파이프라인">불러오는 중</Card>;

  const draft = steps ?? toDraft(active);
  const memoValue = memo ?? active?.adminMemo ?? "";
  const dirty = steps !== null || memo !== null;

  const update = (index: number, patch: Partial<PipelineDraftStep>) =>
    setSteps(draft.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const move = (index: number, delta: number) => {
    const next = [...draft];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSteps(next);
  };

  const estimatedCost = draft.reduce((sum, step) => {
    const model = models?.find((m) => m.id === step.modelId);
    return sum + (model?.unitCostKrw ?? 0);
  }, 0);

  return (
    <Card
      title="실행 파이프라인"
      description="사용자가 만들기를 눌렀을 때 서버가 밟는 단계예요. 여기 적은 글은 사용자에게 절대 보이지 않아요."
      actions={
        <Button
          size="sm"
          disabled={save.isPending || !dirty || draft.length === 0}
          onClick={() => save.mutate({ steps: draft, adminMemo: memoValue || null, activate })}
        >
          {save.isPending ? "저장 중" : "새 버전으로 저장"}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-ground px-3.5 py-2.5">
          {active ? (
            <span className="text-[13px] text-ink">
              지금 <strong className="font-semibold">v{active.version}</strong>가 돌아가요
            </span>
          ) : (
            <span className="text-[13px] text-paid">아직 돌아가는 파이프라인이 없어요</span>
          )}
          <span className="ml-auto font-mono text-[13px] text-ink-soft">
            1회 원가 약 {estimatedCost.toLocaleString()}원
          </span>
        </div>

        {draft.map((step, i) => (
          <StepCard
            key={i}
            index={i}
            step={step}
            models={models ?? []}
            onChange={(patch) => update(i, patch)}
            onMove={(delta) => move(i, delta)}
            onRemove={() => setSteps(draft.filter((_, j) => j !== i))}
          />
        ))}

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setSteps([...draft, { ...EMPTY_STEP }])}
        >
          단계 추가
        </Button>

        <Field label="운영 메모" hint="왜 이렇게 짰는지. 다음에 고칠 사람이 보게 됩니다">
          <Input
            value={memoValue}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="2단계 모델을 바꿔 얼굴 일관성을 올림"
          />
        </Field>

        <Toggle
          checked={activate}
          onChange={setActivate}
          label={activate ? "저장하면 바로 이 버전으로 돌린다" : "저장만 하고 돌리지는 않는다"}
        />

        {save.isError && (
          <p className="text-[13px] text-paid">저장하지 못했어요. 빠진 값이 없는지 확인해주세요.</p>
        )}

        {pipelines && pipelines.length > 0 && (
          <div className="border-t border-line pt-4">
            <p className="text-[13px] font-medium text-ink">지난 버전</p>
            <ul className="mt-2 space-y-1">
              {pipelines.map((p) => (
                <li key={p.id} className="flex items-center gap-2.5 py-1">
                  <span className="font-mono text-[13px] text-ink">v{p.version}</span>
                  {p.active && <Badge tone="good">사용 중</Badge>}
                  <span className="min-w-0 flex-1 truncate text-[12px] text-ink-soft">
                    {p.adminMemo ?? `${p.steps.length}단계`}
                  </span>
                  {!p.active && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={activateOld.isPending}
                      onClick={() => activateOld.mutate(p.id)}
                    >
                      이걸로 되돌리기
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

function StepCard({
  index,
  step,
  models,
  onChange,
  onMove,
  onRemove,
}: {
  index: number;
  step: PipelineDraftStep;
  models: AiModel[];
  onChange: (patch: Partial<PipelineDraftStep>) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
}) {
  const spec = STEP_TYPES.find((t) => t.value === step.type);
  const usable = models.filter((m) => m.capability === spec?.capability);
  const model = models.find((m) => m.id === step.modelId);

  return (
    <div className="rounded-lg border border-line bg-ground p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[12px] text-ink-faint">{index + 1}</span>

        <Select
          value={step.type}
          onChange={(e) => onChange({ type: e.target.value, modelId: null })}
          className="w-40"
          aria-label={`${index + 1}단계 종류`}
        >
          {STEP_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>

        <Select
          value={step.modelId ?? ""}
          onChange={(e) => onChange({ modelId: e.target.value ? Number(e.target.value) : null })}
          className="w-56"
          aria-label={`${index + 1}단계 모델`}
        >
          <option value="">모델 고르기</option>
          {usable.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName} · {m.unitCostKrw.toLocaleString()}원
            </option>
          ))}
        </Select>

        <div className="ml-auto flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => onMove(-1)} aria-label="위로">
            ↑
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onMove(1)} aria-label="아래로">
            ↓
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            빼기
          </Button>
        </div>
      </div>

      {usable.length === 0 && (
        <p className="mt-2 text-[12px] text-paid">
          이 일을 할 수 있는 모델이 켜져 있지 않아요. AI 모델 화면에서 먼저 켜주세요.
        </p>
      )}

      <div className="mt-3 space-y-3">
        <Field
          label="지시문"
          hint="사진이 필요한 자리에 @대표사진 처럼 적으면 아래에 연결 칸이 생겨요. 이 글은 사용자에게 보이지 않아요."
        >
          <Textarea
            value={step.prompt}
            onChange={(e) => onChange({ prompt: e.target.value })}
            rows={3}
            className="font-mono text-[13px]"
          />
        </Field>

        <PhotoLinks
          prompt={step.prompt}
          inputs={step.inputs}
          stepIndex={index}
          onChange={(inputs) => onChange({ inputs })}
        />

        {model && Object.keys(model.paramSchema).length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(model.paramSchema).map(([key, param]) => (
              <Field key={key} label={key}>
                {param.type === "select" ? (
                  <Select
                    value={String(step.params[key] ?? "")}
                    onChange={(e) =>
                      onChange({ params: { ...step.params, [key]: e.target.value } })
                    }
                  >
                    <option value="">기본값</option>
                    {(param.options ?? []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    type={param.type === "number" ? "number" : "text"}
                    min={param.min}
                    max={param.max}
                    value={String(step.params[key] ?? "")}
                    onChange={(e) =>
                      onChange({
                        params: {
                          ...step.params,
                          [key]: param.type === "number" ? Number(e.target.value) : e.target.value,
                        },
                      })
                    }
                  />
                )}
              </Field>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function toDraft(pipeline: Pipeline | null): PipelineDraftStep[] {
  if (!pipeline) return [];
  return pipeline.steps.map((s) => ({
    type: s.type,
    modelId: s.modelId,
    prompt: s.prompt ?? "",
    params: s.params,
    inputs: s.inputs,
  }));
}

/**
 * 지시문이 부르는 사진들.
 *
 * 지시문에 `@아이사진` 처럼 적으면 그것이 곧 사진 한 장을 받겠다는 뜻이다. 업로드 칸은 저장할 때
 * 이 표시에서 자동으로 만들어지므로, 운영자는 어디에 무엇을 이을지 고를 필요가 없다. 같은 것을
 * 두 군데에 적게 하면 언젠가 어긋나고, 어긋나도 오류가 아니라 엉뚱한 그림으로 나타난다.
 *
 * 여기서 적는 것은 설명뿐이다. 그 글이 사용자가 보는 업로드 칸의 안내 문구가 된다.
 */
function PhotoLinks({
  prompt,
  inputs,
  stepIndex,
  onChange,
}: {
  prompt: string;
  inputs: Record<string, string>;
  stepIndex: number;
  onChange: (inputs: Record<string, string>) => void;
}) {
  const tokens = tokensIn(prompt);

  if (tokens.length === 0) {
    return (
      <p className="rounded-lg bg-ground px-3.5 py-2.5 text-[12px] leading-relaxed text-ink-faint">
        지시문에 <span className="font-mono text-ink">@아이사진</span> 처럼 적으면 사진 한 장을
        받는다는 뜻이에요. 적은 만큼 사용자 화면에 업로드 칸이 생겨요.
      </p>
    );
  }

  return (
    <div>
      <p className="text-[13px] font-medium text-ink">
        첨부 이미지{" "}
        <span className="font-mono text-accent">{tokens.join(", ")}</span>
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-faint">
        지시문이 부르는 사진 {tokens.length}장이에요. 저장하면 사용자 화면에 업로드 칸이 이만큼
        생겨요. 아래 설명은 그 칸에 그대로 보여요.
      </p>

      <div className="mt-2.5 space-y-2">
        {tokens.map((token, i) => {
          const value = inputs[token] ?? "";
          const fromPreviousStep = value.startsWith("steps[");

          return (
            <div key={token} className="flex flex-wrap items-center gap-2">
              <span className="w-32 shrink-0 font-mono text-[13px] text-accent">{token}</span>

              {fromPreviousStep ? (
                <span className="min-w-0 flex-1 text-[13px] text-ink-soft">
                  {Number(value.match(/\d+/)?.[0] ?? 0) + 1}단계 결과물을 씁니다
                </span>
              ) : (
                <Input
                  value={value}
                  onChange={(e) => onChange({ ...inputs, [token]: e.target.value })}
                  placeholder={`${token.slice(1)} — 사용자에게 보일 설명`}
                  className="min-w-0 flex-1"
                  aria-label={`${token} 설명`}
                />
              )}

              {stepIndex > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    onChange({
                      ...inputs,
                      [token]: fromPreviousStep ? "" : `steps[${stepIndex - 1}].output`,
                    })
                  }
                >
                  {fromPreviousStep ? "사용자 사진으로" : "앞 단계 결과로"}
                </Button>
              )}

              {!value && i >= 0 && (
                <span className="shrink-0 text-[12px] text-ink-faint">설명 없음</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** 지시문에서 @이름을 뽑는다. 한글 이름을 쓸 수 있어야 한다 */
function tokensIn(prompt: string): string[] {
  const found = prompt.match(/@[가-힣A-Za-z0-9_]+/g) ?? [];
  return [...new Set(found)];
}


