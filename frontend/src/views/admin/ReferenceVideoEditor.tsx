"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/widgets/admin-shell/Card";

/**
 * 레퍼런스 영상.
 *
 * 영상 템플릿이 바탕으로 쓰는 영상이다. 예시 결과물과 정반대인 것이라 자리를 따로 둔다 —
 * 예시는 이 템플릿이 만들어내는 것이고, 레퍼런스는 만들 때 쓰는 재료다.
 *
 * 세 벌로 나뉜다.
 *
 *   원본      제작에 쓰인다. 이 영상의 길이가 곧 1회 원가다.
 *   목록용    목록에서 자동재생한다. 원본을 틀면 타일 하나에 수십 MB가 나간다.
 *   첫 장면   영상이 뜨기 전에 보일 그림. 브라우저가 떠서 자동으로 만든다.
 *
 * 하나뿐이다. 바뀌면 제작 결과가 통째로 달라지므로 목록이 아니라 값으로 다룬다.
 */
export function ReferenceVideoEditor({ templateId }: { templateId: number }) {
  const queryClient = useQueryClient();
  const pickVideo = useRef<HTMLInputElement>(null);
  const pickPreview = useRef<HTMLInputElement>(null);

  const [video, setVideo] = useState<File | null>(null);
  const [preview, setPreview] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: current, isPending } = useQuery({
    queryKey: adminKeys.referenceVideo(templateId),
    queryFn: () => adminApi.referenceVideo(templateId),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: adminKeys.referenceVideo(templateId) });
    void queryClient.invalidateQueries({ queryKey: adminKeys.templates() });
  };

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

  const save = useMutation({
    mutationFn: async () => {
      if (!video) throw new Error("영상을 먼저 골라주세요.");

      const videoKey = await put(video, video.name, video.type);
      const previewKey = preview ? await put(preview, preview.name, preview.type) : undefined;

      // 첫 장면은 브라우저가 만든다. 실패해도 등록은 계속한다 — 포스터가 없으면 영상이 살짝
      // 늦게 보일 뿐인데, 여기서 막으면 영상 자체를 못 올린다.
      let posterKey: string | undefined;
      try {
        const poster = await captureFirstFrame(preview ?? video);
        posterKey = await put(poster, "poster.jpg", "image/jpeg");
      } catch {
        posterKey = undefined;
      }

      const result = await adminApi.saveReferenceVideo(templateId, {
        videoKey,
        previewKey,
        posterKey,
      });
      setVideo(null);
      setPreview(null);
      return result;
    },
    onSuccess: () => {
      setError(null);
      invalidate();
    },
    onError: (e: Error) => setError(e.message),
  });

  const clear = useMutation({
    mutationFn: () => adminApi.clearReferenceVideo(templateId),
    onSettled: invalidate,
  });

  const has = Boolean(current?.videoKey);

  return (
    <div className="space-y-5">
      <Card
        title="레퍼런스 영상"
        description="이 영상을 바탕으로 제작해요. 올린 사진으로 영상 속 인물이나 배경만 갈아 끼워요."
      >
        {isPending ? (
          <p className="text-[13px] text-ink-faint">불러오는 중</p>
        ) : has ? (
          <div className="flex flex-wrap gap-4">
            <video
              src={current?.previewUrl ?? current?.videoUrl ?? undefined}
              poster={current?.posterUrl ?? undefined}
              muted
              loop
              controls
              playsInline
              className="w-64 rounded-lg bg-ground"
            />

            <div className="min-w-0 flex-1 space-y-2 text-[13px]">
              <KeyRow label="원본" value={current?.videoKey} hint="제작에 쓰여요" />
              <KeyRow
                label="목록용"
                value={current?.previewKey}
                hint="목록에서 자동재생해요"
              />
              <KeyRow label="첫 장면" value={current?.posterKey} hint="뜨기 전에 보여요" />

              {!current?.previewKey && (
                <p className="rounded-lg bg-paid/10 px-3 py-2 text-[12px] leading-relaxed text-paid">
                  목록용 영상이 없어서 원본이 목록에서 돌아요. 목록을 열 때마다 원본이 통째로
                  내려가요.
                </p>
              )}

              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="secondary" onClick={() => pickVideo.current?.click()}>
                  바꾸기
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-ink-faint hover:text-paid"
                  disabled={clear.isPending}
                  onClick={() => clear.mutate()}
                >
                  떼기
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-line py-10 text-center">
            <p className="text-[13px] text-ink-soft">
              레퍼런스 영상이 없어요. 이게 없으면 제작이 시작되지 않아요.
            </p>
            <Button size="sm" className="mt-4" onClick={() => pickVideo.current?.click()}>
              영상 고르기
            </Button>
          </div>
        )}

        <input
          ref={pickVideo}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) {
              setVideo(file);
              setPreview(null);
              setError(null);
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
      </Card>

      {video && (
        <Card title="올릴 영상">
          <dl className="space-y-2 text-[13px]">
            <FileRow label="원본" file={video} hint="제작에 쓰여요" />
            <FileRow label="목록용" file={preview} hint="목록에서 자동재생해요" />
          </dl>

          {!preview && video.size > 3 * 1024 * 1024 && (
            <p className="mt-3 rounded-lg bg-paid/10 px-3 py-2 text-[12px] leading-relaxed text-paid">
              목록용 영상 없이 올리면 목록을 열 때마다 이 {mb(video.size)} 파일이 타일마다
              내려가요. 짧고 작게 줄인 영상을 함께 올려주세요.
            </p>
          )}

          {error && <p className="mt-3 text-[13px] text-paid">{error}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => pickPreview.current?.click()}>
              목록용 영상 고르기
            </Button>
            <Button size="sm" disabled={save.isPending} onClick={() => save.mutate()}>
              {save.isPending ? "올리는 중" : "등록"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setVideo(null);
                setPreview(null);
                setError(null);
              }}
            >
              취소
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

function KeyRow({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | null | undefined;
  hint: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <dt className="w-16 shrink-0 text-ink-faint">{label}</dt>
      <dd className="min-w-0 flex-1 truncate font-mono text-[12px] text-ink">
        {value ?? <span className="font-sans text-ink-faint">없음</span>}
      </dd>
      <span className="text-[12px] text-ink-faint">{hint}</span>
    </div>
  );
}

function FileRow({
  label,
  file,
  hint,
}: {
  label: string;
  file: File | null;
  hint: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <dt className="w-16 shrink-0 text-ink-faint">{label}</dt>
      <dd className="min-w-0 flex-1 break-all text-ink">
        {file ? (
          <>
            {file.name} · {mb(file.size)}
          </>
        ) : (
          <span className="text-ink-faint">없음 — 원본이 그대로 돌아요</span>
        )}
      </dd>
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
 * 서버에서 하려면 ffmpeg 이 필요한데, 그것 하나 때문에 배포 이미지를 키우고 싶지 않다.
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
          if (blob) resolve(blob);
          else reject(new Error("첫 장면을 만들지 못했어요."));
        },
        "image/jpeg",
        0.8,
      );
    };
  });
}
