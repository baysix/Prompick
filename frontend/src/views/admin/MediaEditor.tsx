"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import { ApiError } from "@/shared/api/client";

/**
 * 예시 결과물 등록.
 *
 * 이 템플릿으로 직접 만든 결과물만 올린다. 인스타 등 외부 원본은 올리지 않는다.
 * 업로드는 발급받은 주소로 브라우저가 스토리지에 직접 보내고, 끝난 뒤 서버에 등록만 알린다.
 */
export function MediaEditor({ templateId }: { templateId: number }) {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data } = useQuery({
    queryKey: adminKeys.media(templateId),
    queryFn: () => adminApi.media(templateId),
  });

  const remove = useMutation({
    mutationFn: (mediaId: number) => adminApi.deleteMedia(templateId, mediaId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.media(templateId) });
      void queryClient.invalidateQueries({ queryKey: adminKeys.template(templateId) });
    },
  });

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      // 1. 업로드 주소를 받는다
      const presigned = await adminApi.presignMedia(templateId, {
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
      });

      // 2. 스토리지로 바로 보낸다. 파일이 백엔드를 거치지 않는다
      const res = await fetch(presigned.url, {
        method: presigned.method,
        headers: presigned.headers,
        body: file,
      });
      if (!res.ok) throw new Error("업로드에 실패했어요.");

      // 3. 업로드가 끝났음을 알린다
      await adminApi.registerMedia(templateId, { storageKey: presigned.storageKey });

      void queryClient.invalidateQueries({ queryKey: adminKeys.media(templateId) });
      void queryClient.invalidateQueries({ queryKey: adminKeys.template(templateId) });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[16px] font-semibold text-ink">예시 결과물</h2>
        <p className="mt-0.5 text-[12px] text-ink-soft">
          이 템플릿으로 직접 만든 것만 올려요. 첫 번째가 목록 카드에 나와요.
        </p>
      </div>

      {data && data.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {data.map((m) => (
            <li key={m.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.url}
                alt=""
                className="h-28 w-20 border border-line object-cover"
              />
              <button
                type="button"
                onClick={() => remove.mutate(m.id)}
                className="absolute right-1 top-1 rounded-sm bg-ink/75 px-1 py-0.5 text-[10px] text-ground"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <input
          ref={fileInput}
          type="file"
          accept="image/*,video/mp4,video/webm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
          className="text-[13px] text-ink-soft file:mr-2 file:rounded-sm file:border file:border-line file:bg-ground-raised file:px-2.5 file:py-1 file:text-[13px] file:text-ink"
        />
        {uploading && <span className="text-[12px] text-ink-faint">올리는 중</span>}
      </div>

      {error && <p className="text-[13px] text-[#b0413e]">{error}</p>}
    </section>
  );
}
