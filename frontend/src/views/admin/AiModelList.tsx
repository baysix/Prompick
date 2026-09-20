"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import type { AiModel, Capability } from "@/entities/admin/model/types";
import { Button } from "@/shared/ui/Button";
import { Badge, Card, Input, Toggle } from "@/widgets/admin-shell/Card";

/**
 * 쓸 수 있는 AI 모델 관리.
 *
 * 여기서 정하는 것은 둘이다 — 파이프라인에서 고를 수 있게 할지, 1회 원가가 얼마인지.
 * 원가를 적어두면 파이프라인을 짤 때 이 템플릿이 남는 장사인지 그 자리에서 보인다.
 */
const CAPABILITY_LABEL: Record<Capability, string> = {
  TEXT: "글 쓰기",
  VISION: "사진 읽기",
  IMAGE: "이미지 만들기",
  IMAGE_EDIT: "이미지 고치기",
  VIDEO: "영상 만들기",
  AUDIO: "소리 만들기",
};

export function AiModelList() {
  const { data, isPending } = useQuery({
    queryKey: adminKeys.models(),
    queryFn: adminApi.modelsAll,
  });

  if (isPending) return <p className="text-[13px] text-ink-faint">불러오는 중</p>;

  const models = data ?? [];
  const groups = Object.entries(
    models.reduce<Record<string, AiModel[]>>((acc, m) => {
      (acc[m.capability] ??= []).push(m);
      return acc;
    }, {}),
  );

  return (
    <div className="space-y-5">
      <p className="text-[13px] leading-relaxed text-ink-soft">
        켜둔 모델만 파이프라인에서 고를 수 있어요. 원가는 파이프라인 한 번 실행에 드는 비용을
        계산하는 데 써요. 사용자에게는 어떤 모델을 쓰는지 보이지 않아요.
      </p>

      {groups.map(([capability, list]) => (
        <Card key={capability} title={CAPABILITY_LABEL[capability as Capability] ?? capability}>
          <ul className="divide-y divide-line">
            {list.map((model) => (
              <ModelRow key={model.id} model={model} />
            ))}
          </ul>
        </Card>
      ))}

      {models.length === 0 && (
        <Card>
          <p className="text-[13px] text-ink-soft">
            등록된 모델이 없어요. 모델은 마이그레이션으로 넣어요.
          </p>
        </Card>
      )}
    </div>
  );
}

function ModelRow({ model }: { model: AiModel }) {
  const queryClient = useQueryClient();
  const [cost, setCost] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (body: { active: boolean; unitCostKrw?: number }) =>
      adminApi.configureModel(model.id, body),
    onSettled: () => {
      setCost(null);
      void queryClient.invalidateQueries({ queryKey: adminKeys.models() });
    },
  });

  const editing = cost !== null;
  const value = cost ?? String(model.unitCostKrw);

  return (
    <li className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[14px] font-medium text-ink">
          {model.displayName}
          <Badge>{model.provider}</Badge>
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-ink-faint">{model.modelKey}</p>
        {model.memo && <p className="mt-1 text-[12px] text-ink-soft">{model.memo}</p>}
      </div>

      <div className="flex items-center gap-1.5">
        <Input
          value={value}
          onChange={(e) => setCost(e.target.value.replace(/[^0-9]/g, ""))}
          inputMode="numeric"
          className="w-24 text-right font-mono"
          aria-label={`${model.displayName} 1회 원가`}
        />
        <span className="text-[12px] text-ink-faint">원/회</span>
        {editing && (
          <Button
            size="sm"
            disabled={save.isPending}
            onClick={() => save.mutate({ active: model.active, unitCostKrw: Number(value || 0) })}
          >
            저장
          </Button>
        )}
      </div>

      <Toggle
        checked={model.active}
        onChange={(next) => save.mutate({ active: next })}
        label={model.active ? "사용" : "중지"}
      />
    </li>
  );
}
