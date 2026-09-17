"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import type { PublicPromptForm } from "@/entities/admin/model/types";

/**
 * 공개 프롬프트 편집기.
 *
 * 여기 넣는 값은 사용자가 그대로 복사해 가는 텍스트다. 서버가 실제로 실행하는 내부 프롬프트는
 * 아래 제작 방법(파이프라인)에 따로 넣는다. 둘은 보통 다르다 — 그래서 공개해도 품질이 재현되지 않는다.
 */
export function PublicPromptEditor({ templateId }: { templateId: number }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<PublicPromptForm | null>(null);
  const [saved, setSaved] = useState(false);

  const { data } = useQuery({
    queryKey: adminKeys.publicPrompt(templateId),
    queryFn: () => adminApi.publicPrompt(templateId),
  });

  const value = draft ??
    data ?? { body: "", negativePrompt: null, recommendedTool: null, usageTip: null };

  const save = useMutation({
    mutationFn: () => adminApi.savePublicPrompt(templateId, value),
    onSuccess: () => {
      setDraft(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      void queryClient.invalidateQueries({ queryKey: adminKeys.publicPrompt(templateId) });
      void queryClient.invalidateQueries({ queryKey: adminKeys.template(templateId) });
    },
  });

  function set(patch: Partial<PublicPromptForm>) {
    setDraft({ ...value, ...patch });
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-[16px] font-semibold text-ink">공개할 프롬프트</h2>
        <p className="mt-0.5 text-[12px] text-ink-soft">
          사용자가 복사해서 쓰는 원문이에요. 아래 제작 방법과 같을 필요는 없어요.
        </p>
      </div>

      <div className="space-y-1">
        <label className="block text-[12px] text-ink-soft">원문</label>
        <textarea
          value={value.body}
          onChange={(e) => set({ body: e.target.value })}
          rows={4}
          placeholder="A product floating in mid-air against a seamless pastel backdrop..."
          className="w-full border border-line bg-ground-raised px-2.5 py-2 font-mono text-[12.5px] leading-relaxed"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-[12px] text-ink-soft">빼야 할 것</label>
        <input
          value={value.negativePrompt ?? ""}
          onChange={(e) => set({ negativePrompt: e.target.value })}
          placeholder="text, watermark, extra objects"
          className="w-full border border-line bg-ground-raised px-2.5 py-1.5 font-mono text-[12.5px]"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="block text-[12px] text-ink-soft">어디에 쓰는지</label>
          <input
            value={value.recommendedTool ?? ""}
            onChange={(e) => set({ recommendedTool: e.target.value })}
            placeholder="Midjourney v7 / Runway Gen-4"
            className="w-full border border-line bg-ground-raised px-2.5 py-1.5 text-[13px]"
          />
        </div>
        <div className="space-y-1">
          <label className="block text-[12px] text-ink-soft">쓰는 요령</label>
          <input
            value={value.usageTip ?? ""}
            onChange={(e) => set({ usageTip: e.target.value })}
            className="w-full border border-line bg-ground-raised px-2.5 py-1.5 text-[13px]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={!value.body.trim() || save.isPending}
          className="rounded-sm border border-line px-3 py-1.5 text-[13px] text-ink disabled:opacity-40"
        >
          {save.isPending ? "저장 중" : "프롬프트 저장"}
        </button>
        {saved && <span className="text-[12px] text-free">저장했어요</span>}
      </div>
    </section>
  );
}
