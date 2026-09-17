"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import type { AiModel, Capability } from "@/entities/admin/model/types";
import { cn } from "@/shared/lib/cn";
import { Card } from "@/widgets/admin-shell/Card";

const CAPABILITY_LABEL: Record<Capability, string> = {
  TEXT: "글 다루기",
  VISION: "사진 읽기",
  IMAGE: "이미지 만들기",
  IMAGE_EDIT: "이미지 다듬기",
  VIDEO: "영상 만들기",
  AUDIO: "소리 만들기",
};

/**
 * AI 모델 관리.
 *
 * 켜지 않은 모델은 파이프라인에서 고를 수 없다. 약관을 확인하고 API 키를 넣은 뒤에 켠다.
 * 원가는 유료 템플릿 가격을 정할 때 마진을 가늠하는 기준이 된다.
 */
export function AiModelList() {
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery({
    queryKey: adminKeys.models(),
    queryFn: () => adminApi.modelsAll(),
  });

  const toggle = useMutation({
    mutationFn: (m: AiModel) => adminApi.configureModel(m.id, { active: !m.active }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: adminKeys.models() }),
  });

  const grouped = (data ?? []).reduce<Record<string, AiModel[]>>((acc, m) => {
    (acc[m.provider] ??= []).push(m);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {isPending ? (
        <p className="py-16 text-[13px] text-ink-faint">불러오는 중</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([provider, models]) => (
            <Card
              key={provider}
              title={provider}
              description="켜둔 모델만 제작 방법에서 고를 수 있어요"
            >
              <ul className="divide-y divide-line">
                {models.map((m) => (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 py-2.5">
                    <span className="text-[14px] text-ink">{m.displayName}</span>
                    <span className="text-[12px] text-ink-faint">
                      {CAPABILITY_LABEL[m.capability]}
                    </span>
                    <span className="font-mono text-[11px] text-ink-faint">{m.modelKey}</span>

                    <span className="ml-auto text-[13px] text-ink-soft">
                      {m.unitCostKrw.toLocaleString()}원
                    </span>

                    <button
                      type="button"
                      onClick={() => toggle.mutate(m)}
                      className={cn(
                        "rounded-sm px-2.5 py-1 text-[12px] font-medium",
                        m.active ? "bg-free-soft text-free" : "border border-line text-ink-faint",
                      )}
                    >
                      {m.active ? "사용 중" : "꺼짐"}
                    </button>
                  </li>
                ))}
              </ul>
              {models.some((m) => m.memo) && (
                <ul className="mt-3 space-y-0.5 border-t border-line pt-3">
                  {models
                    .filter((m) => m.memo)
                    .map((m) => (
                      <li key={m.id} className="text-[11px] text-ink-faint">
                        {m.displayName} — {m.memo}
                      </li>
                    ))}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
