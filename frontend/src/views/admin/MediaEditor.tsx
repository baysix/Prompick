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
 *
 * 영상은 세 벌로 나뉜다. 한 벌로 끝내면 목록에서 원본이 재생되는데, 19MB 짜리가 타일마다
 * 돌면 그 화면 한 번에 수백 MB 가 나간다. 모바일에서 특히 아프다.
 *
 *   원본        제작에 쓰인다. Genjutsu 같은 영상 모델의 참조 영상이 이것이다.
 *   미리보기    목록에서 자동재생한다. 짧고 작게 줄인 것.
 *   첫 장면     영상이 뜨기 전에 보이는 그림. 브라우저가 떠서 자동으로 만든다.
 */
export function MediaEditor({ templateId }: { templateId: number }) {
  const queryClient = useQueryClient();
  const pickFile = useRef<HTMLInputElement>(null);
  const pickPreview = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);

  // 영상은 미리보기를 함께 받아야 해서 곧바로 올리지 않고 한 번 멈춘다.
  const [video, setVideo] = useState<File | null>(null);
  const [preview, setPreview] = useState<File | null>(null);

  const { data, isPending } = useQuery({
    queryKey: adminKeys.media(templateId),
    queryFn: () => adminApi.media(templateId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: adminKeys.media(templateId) });
    void queryClient.invalidateQueries({ queryKey: adminKeys.templates() });
  };

  /** 스토리지에 바로 올리고 저장소 키를 돌려준다 */
  async function put(file: Blob, fileName: string, contentType: string) {
    const slot = await adminApi.presignMedia(templateId, { fileName, contentType });
    const res = await fetch(slot.url, {
      method: slot.method,
      headers: slot.headers,
      body: file,
    });
    if (!res.ok) throw new Error("스토리지에 올리지 못했어요.");
    return slot.storageKey;
  }

  const upload = useMutation({
    mutationFn: async () => {
      if (video) {
        const storageKey = await put(video, video.name, video.type);

        const previewKey = preview
          ? await put(preview, preview.name, preview.type)
          : // 미리보기를 안 주면 원본이 목록에서 돈다. 막지는 않되 아래에서 경고한다.
            storageKey;

        // 첫 장면은 브라우저가 떠서 만든다. 실패해도 등록은 계속한다 —
        // 포스터가 없으면 살짝 늦게 보일 뿐이지만, 여기서 막으면 영상 자체를 못 올린다.
        let thumbnailKey: string | undefined;
        try {
          const poster = await captureFirstFrame(preview ?? video);
          thumbnailKey = await put(poster, "poster.jpg", "image/jpeg");
        } catch {
          thumbnailKey = undefined;
        }

        const result = await adminApi.registerMedia(templateId, {
          storageKey,
          previewKey,
          thumbnailKey,
        });
        setVideo(null);
        setPreview(null);
        return result;
      }

      throw new Error("올릴 파일이 없어요.");
    },
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      const storageKey = await put(file, file.name, file.type);
      return adminApi.registerMedia(templateId, { storageKey });
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
  const busy = upload.isPending || uploadImage.isPending;

  return (
    <Card
      title="예시 결과물"
      description="사용자가 가장 먼저 보는 것이에요. 첫 번째 것이 목록의 대표가 돼요."
      actions={
        <Button
          size="sm"
          variant="secondary"
          disabled={busy}
          onClick={() => pickFile.current?.click()}
        >
          {busy ? "올리는 중" : "파일 추가"}
        </Button>
      }
    >
      <input
        ref={pickFile}
        type="file"
        accept="image/*,video/mp4,video/webm,video/quicktime"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;

          setError(null);
          if (file.type.startsWith("video/")) {
            setVideo(file);
            setPreview(null);
          } else {
            uploadImage.mutate(file);
          }
        }}
      />

      <input
        ref={pickPreview}
        type="file"
        accept="video/mp4,video/webm"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) setPreview(file);
        }}
      />

      {video && (
        <div className="mb-4 rounded-xl border border-line p-4">
          <p className="text-[14px] font-semibold text-ink">영상 등록</p>

          <dl className="mt-3 space-y-2 text-[13px]">
            <Row label="원본" hint="제작에 쓰여요">
              {video.name} · {mb(video.size)}
            </Row>

            <Row label="목록용" hint="목록에서 자동재생해요">
              {preview ? (
                <>
                  {preview.name} · {mb(preview.size)}
                </>
              ) : (
                <span className="text-ink-faint">없음 — 원본이 그대로 돌아요</span>
              )}
            </Row>
          </dl>

          {!preview && video.size > 3 * 1024 * 1024 && (
            <p className="mt-3 rounded-lg bg-paid/10 px-3 py-2 text-[12px] leading-relaxed text-paid">
              목록용 영상 없이 올리면 목록을 열 때마다 이 {mb(video.size)} 파일이 타일마다
              내려가요. 짧고 작게 줄인 영상을 함께 올려주세요.
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => pickPreview.current?.click()}>
              목록용 영상 고르기
            </Button>
            <Button size="sm" disabled={upload.isPending} onClick={() => upload.mutate()}>
              {upload.isPending ? "올리는 중" : "등록"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setVideo(null);
                setPreview(null);
              }}
            >
              취소
            </Button>
          </div>
        </div>
      )}

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

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <dt className="w-14 shrink-0 text-ink-faint">{label}</dt>
      <dd className="min-w-0 flex-1 break-all text-ink">{children}</dd>
      <span className="text-[12px] text-ink-faint">{hint}</span>
    </div>
  );
}

function mb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/**
 * 영상의 첫 장면을 그림으로 뜬다.
 *
 * <p>서버에서 하려면 ffmpeg 이 필요한데, 그것 하나 때문에 배포 이미지를 키우고 싶지 않다.
 * 브라우저는 이미 영상을 디코딩할 줄 아니 여기서 하는 편이 싸다.
 */
function captureFirstFrame(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    const fail = (reason: string) => {
      URL.revokeObjectURL(url);
      reject(new Error(reason));
    };

    video.onerror = () => fail("영상을 읽지 못했어요.");

    video.onloadeddata = () => {
      // 맨 첫 프레임은 검은 화면인 경우가 많다. 조금 뒤로 간다.
      video.currentTime = Math.min(0.5, video.duration / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext("2d");
      if (!context) return fail("첫 장면을 그리지 못했어요.");

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          blob ? resolve(blob) : reject(new Error("첫 장면을 만들지 못했어요."));
        },
        "image/jpeg",
        0.8,
      );
    };
  });
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
