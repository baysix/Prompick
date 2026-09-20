"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import type { TemplateMediaItem } from "@/entities/admin/model/types";
import { isPlayableVideo } from "@/entities/template/lib/media";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/widgets/admin-shell/Card";

/**
 * 예시 결과물.
 *
 * 사용자가 템플릿을 고르는 근거는 설명이 아니라 예시다. 그래서 여러 장을 올릴 수 있게 하고,
 * 첫 번째 것이 목록의 대표가 된다.
 *
 * 파일은 백엔드를 거치지 않고 스토리지로 바로 올라간다. 큰 영상이 우리 서버 메모리를
 * 지나가면 동시에 몇 개만 올려도 버틴다.
 */
export function MediaEditor({ templateId }: { templateId: number }) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isPending } = useQuery({
    queryKey: adminKeys.media(templateId),
    queryFn: () => adminApi.media(templateId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: adminKeys.media(templateId) });
    void queryClient.invalidateQueries({ queryKey: adminKeys.templates() });
  };

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const slot = await adminApi.presignMedia(templateId, {
        fileName: file.name,
        contentType: file.type,
      });

      const res = await fetch(slot.url, {
        method: slot.method,
        headers: slot.headers,
        body: file,
      });
      if (!res.ok) throw new Error("스토리지에 올리지 못했어요.");

      return adminApi.registerMedia(templateId, { storageKey: slot.storageKey });
    },
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const remove = useMutation({
    mutationFn: (mediaId: number) => adminApi.deleteMedia(templateId, mediaId),
    onSettled: invalidate,
  });

  const items = data ?? [];

  return (
    <Card
      title="예시 결과물"
      description="사용자가 가장 먼저 보는 것이에요. 첫 번째 것이 목록의 대표가 돼요."
      actions={
        <Button
          size="sm"
          variant="secondary"
          disabled={upload.isPending}
          onClick={() => fileInput.current?.click()}
        >
          {upload.isPending ? "올리는 중" : "파일 추가"}
        </Button>
      }
    >
      <input
        ref={fileInput}
        type="file"
        accept="image/*,video/mp4,video/webm"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload.mutate(file);
          e.target.value = "";
        }}
      />

      {error && <p className="mb-3 text-[13px] text-paid">{error}</p>}

      {isPending ? (
        <p className="text-[13px] text-ink-faint">불러오는 중</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line py-12 text-center text-[13px] text-ink-soft">
          아직 예시가 없어요. 예시 없이 공개하면 아무도 고르지 않아요.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {items.map((item, i) => (
            <MediaCell
              key={item.id}
              item={item}
              cover={i === 0}
              onRemove={() => remove.mutate(item.id)}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}

function MediaCell({
  item,
  cover,
  onRemove,
}: {
  item: TemplateMediaItem;
  cover: boolean;
  onRemove: () => void;
}) {
  return (
    <li className="group relative aspect-[9/16] overflow-hidden rounded-lg bg-ground">
      {isPlayableVideo(item.url) ? (
        <video src={item.url} muted loop playsInline className="h-full w-full object-cover" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.url} alt="" className="h-full w-full object-cover" />
      )}

      {cover && (
        <span className="absolute left-1.5 top-1.5 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-ink">
          대표
        </span>
      )}

      <button
        type="button"
        onClick={onRemove}
        className="absolute right-1.5 top-1.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        삭제
      </button>
    </li>
  );
}
