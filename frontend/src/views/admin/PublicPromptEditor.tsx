"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import type { PublicPromptForm } from "@/entities/admin/model/types";
import type { PromptAccess } from "@/entities/template/model/types";
import { Button } from "@/shared/ui/Button";
import { Card, Field, Input, Textarea } from "@/widgets/admin-shell/Card";

/**
 * 사용자에게 보여줄 프롬프트 원문.
 *
 * 이것은 파이프라인과 완전히 다른 물건이다. 파이프라인은 우리가 돌리는 내부 지시문이고,
 * 이건 사용자가 자기 AI에 붙여넣어 쓰라고 주는 글이다. 두 값이 같아도 테이블이 따로인 이유는,
 * 한쪽을 공개로 바꾸다가 다른 쪽이 딸려 나가는 일을 구조적으로 막기 위해서다.
 */
const EMPTY: PublicPromptForm = {
  body: "",
  negativePrompt: null,
  recommendedTool: null,
  usageTip: null,
};

export function PublicPromptEditor({
  templateId,
  promptAccess,
}: {
  templateId: number;
  promptAccess: PromptAccess;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<PublicPromptForm | null>(null);

  const { data, isPending } = useQuery({
    queryKey: adminKeys.publicPrompt(templateId),
    queryFn: () => adminApi.publicPrompt(templateId).catch(() => EMPTY),
  });

  const save = useMutation({
    mutationFn: (form: PublicPromptForm) => adminApi.savePublicPrompt(templateId, form),
    onSuccess: () => {
      setDraft(null);
      void queryClient.invalidateQueries({ queryKey: adminKeys.publicPrompt(templateId) });
      void queryClient.invalidateQueries({ queryKey: adminKeys.templates() });
    },
  });

  if (isPending) return <Card title="공개 프롬프트">불러오는 중</Card>;

  const form = draft ?? data ?? EMPTY;
  const set = (patch: Partial<PublicPromptForm>) => setDraft({ ...form, ...patch });

  return (
    <Card
      title="공개 프롬프트"
      description={
        promptAccess === "HIDDEN"
          ? "지금은 비공개예요. 여기 적어두어도 사용자에게 보이지 않아요."
          : promptAccess === "FREE"
            ? "로그인한 사용자 누구나 이 원문을 볼 수 있어요."
            : "프롬비를 낸 사용자에게 이 원문이 그대로 보여요."
      }
      actions={
        <Button
          size="sm"
          disabled={save.isPending || !draft || form.body.trim() === ""}
          onClick={() => save.mutate(form)}
        >
          {save.isPending ? "저장 중" : "저장"}
        </Button>
      }
    >
      <div className="space-y-4">
        <Field
          label="원문"
          required
          hint="사용자가 복사해서 쓸 글이에요. 우리 내부 지시문이 아니라, 다른 AI에 붙여넣어도 통하는 형태로 적어주세요."
        >
          <Textarea
            value={form.body}
            onChange={(e) => set({ body: e.target.value })}
            rows={8}
            className="font-mono text-[13px]"
            placeholder="A cinematic portrait of..."
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="제외할 것" hint="네거티브 프롬프트를 쓰는 도구를 위해">
            <Input
              value={form.negativePrompt ?? ""}
              onChange={(e) => set({ negativePrompt: e.target.value || null })}
              className="font-mono text-[13px]"
              placeholder="blurry, watermark"
            />
          </Field>

          <Field label="추천 도구" hint="이 프롬프트가 가장 잘 먹히는 곳">
            <Input
              value={form.recommendedTool ?? ""}
              onChange={(e) => set({ recommendedTool: e.target.value || null })}
              placeholder="Midjourney v7"
            />
          </Field>
        </div>

        <Field label="쓰는 요령" hint="사용자가 실패하기 쉬운 지점을 한두 줄로">
          <Textarea
            value={form.usageTip ?? ""}
            onChange={(e) => set({ usageTip: e.target.value || null })}
            rows={3}
            placeholder="얼굴이 정면인 사진일수록 잘 나와요."
          />
        </Field>

        {save.isError && (
          <p className="text-[13px] text-paid">저장하지 못했어요. 잠시 후 다시 해주세요.</p>
        )}
      </div>
    </Card>
  );
}
