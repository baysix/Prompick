"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import {
  generationApi,
  generationKeys,
  uploadDirect,
} from "@/entities/generation/api/generationApi";
import type { UploadCheck } from "@/entities/generation/model/types";
import type { TemplateDetail } from "@/entities/template/model/types";
import { ApiError } from "@/shared/api/client";
import { EditTemplateLink } from "@/widgets/admin-shortcut/EditTemplateLink";
import { useSession } from "@/shared/auth/SessionProvider";
import { cn } from "@/shared/lib/cn";
import { Button, ButtonLink } from "@/shared/ui/Button";

/**
 * 만들기.
 *
 * 한 화면에서 끝낸다. 사용자의 목적은 사진을 올리는 것이지 가이드를 읽는 것이 아니다.
 * 가이드는 없애지 않고 접어 둔다 — 읽을 사람은 읽고, 바로 올릴 사람은 바로 올린다.
 *
 * 단계로 쪼개면 모두가 거쳐야 하는 관문이 되고, 그사이 그만둘 이유만 늘어난다.
 */
export function CreateForm({ template }: { template: TemplateDetail }) {
  const router = useRouter();
  const { signedIn, loading } = useSession();

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [checks, setChecks] = useState<Record<string, UploadCheck>>({});
  const [error, setError] = useState<string | null>(null);

  // 화면에 들어올 때 한 번만 만든다. 버튼을 두 번 눌러도 작업이 하나만 생긴다.
  const [idempotencyKey] = useState(
    () => `${template.slug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );

  const { data: freeUsage } = useQuery({
    queryKey: generationKeys.freeUsage(),
    queryFn: () => generationApi.freeUsage(),
    enabled: signedIn,
  });

  const example = template.media[0]?.thumbnailUrl ?? template.media[0]?.url ?? null;
  const imageFields = template.inputFields.filter((f) => f.fieldType === "IMAGE");
  const optionFields = template.inputFields.filter((f) => f.fieldType !== "IMAGE");

  const create = useMutation({
    mutationFn: () => generationApi.create(template.slug, values, idempotencyKey),
    onSuccess: (job) => router.push(`/jobs/${job.id}`),
    onError: (e) => setError(e instanceof ApiError ? e.message : "요청하지 못했어요."),
  });

  if (loading) return <Center>확인 중</Center>;

  if (!signedIn) {
    return (
      <Center>
        <p className="text-[16px] font-semibold text-ink">로그인하면 바로 만들 수 있어요</p>
        <ButtonLink
          href={`/login?next=${encodeURIComponent(`/t/${template.slug}/create`)}`}
          className="mt-5"
        >
          로그인
        </ButtonLink>
      </Center>
    );
  }

  const isFree = template.generateAccess === "FREE";
  const noFreeLeft = isFree && freeUsage != null && freeUsage.remaining <= 0;
  const missing = imageFields.filter((f) => f.required && !values[f.fieldKey]);
  const blocked = Object.values(checks).some((c) => c.status === "BLOCKED");
  const ready = missing.length === 0 && !blocked && !noFreeLeft;

  return (
    <main className="flex-1 pb-28">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/t/${template.slug}`} className="text-[13px] text-ink-soft hover:text-ink">
            ← {template.title}
          </Link>
          <EditTemplateLink slug={template.slug} />
        </div>

        {/* 무엇을 만드는지 계속 보이게 한다. 목표를 잊으면 아무 사진이나 올리게 된다 */}
        <div className="mt-4 flex items-center gap-4">
          {example && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={example}
              alt=""
              className="h-24 w-[68px] shrink-0 rounded-xl object-cover"
            />
          )}
          <div className="min-w-0">
            <h1 className="text-[22px] font-bold leading-snug tracking-[-0.04em] text-ink">
              {template.requiredPhotoSummary ?? "사진"}만 올리면 돼요
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
              왼쪽 같은 결과가 나와요. 매번 조금씩은 달라요.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {imageFields.map((field) => (
            <PhotoDrop
              key={field.fieldKey}
              label={field.label}
              helpText={field.helpText}
              check={checks[field.fieldKey]}
              validation={field.validation}
              onUploaded={(uploadId, check) => {
                setValues((v) => ({ ...v, [field.fieldKey]: uploadId }));
                setChecks((c) => ({ ...c, [field.fieldKey]: check }));
              }}
            />
          ))}

          {imageFields.length === 0 && (
            <p className="rounded-xl bg-surface px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
              이 템플릿은 올릴 사진이 아직 정해지지 않았어요.
            </p>
          )}
        </div>

        {template.uploadGuide?.checklist && template.uploadGuide.checklist.length > 0 && (
          <details className="group mt-3 rounded-xl border border-line px-4 py-3">
            <summary className="list-none text-[13px] font-medium text-accent">
              어떤 사진이 잘 나오나요
              <span className="ml-1.5 text-ink-faint group-open:hidden">펼치기</span>
            </summary>
            <ul className="mt-3 space-y-1.5">
              {template.uploadGuide.checklist.map((item) => (
                <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-ink-soft">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ink-faint" />
                  {item}
                </li>
              ))}
            </ul>
          </details>
        )}

        {optionFields.length > 0 && (
          <div className="mt-6 space-y-4">
            {optionFields.map((field) => (
              <div key={field.fieldKey}>
                <p className="text-[13px] font-medium text-ink">{field.label}</p>
                {field.fieldType === "SELECT" ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {field.options.map((option) => {
                      const selected = values[field.fieldKey] === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setValues((v) => ({ ...v, [field.fieldKey]: option.value }))}
                          className={cn(
                            "rounded-lg px-3.5 py-1.5 text-[13px] transition-colors",
                            selected
                              ? "bg-accent font-semibold text-accent-ink"
                              : "bg-white/5 text-ink-soft hover:text-ink",
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <input
                    value={String(values[field.fieldKey] ?? "")}
                    onChange={(e) => setValues((v) => ({ ...v, [field.fieldKey]: e.target.value }))}
                    className="mt-2 w-full rounded-xl bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {error && (
          <p className="mt-5 rounded-xl bg-[#3a1d1d] px-4 py-3 text-[13px] leading-relaxed text-[#ff9b9b]">
            {error}
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ground/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3">
          <div className="min-w-0 flex-1 text-[12px] leading-snug text-ink-soft">
            {noFreeLeft ? (
              "오늘 무료 횟수를 다 썼어요. 내일 자정에 다시 채워져요"
            ) : (
              <>
                {isFree ? `무료 · 오늘 ${freeUsage?.remaining ?? 0}회 남음` : `🪙 ${template.generateCost}`}
                <span className="block text-ink-faint">
                  약 {Math.round(template.estimatedSeconds / 60)}분 걸려요
                </span>
              </>
            )}
          </div>
          <Button
            size="lg"
            onClick={() => create.mutate()}
            disabled={!ready || create.isPending}
            className="shrink-0"
          >
            {create.isPending
              ? "보내는 중"
              : blocked
                ? "사진을 바꿔주세요"
                : noFreeLeft
                  ? "오늘 무료 횟수를 다 썼어요"
                  : isFree && freeUsage
                    ? `${freeUsage.remaining}회 무료 만들기`
                    : "만들기"}
          </Button>
        </div>
      </div>
    </main>
  );
}

/**
 * 사진 한 장을 받는 자리.
 *
 * 끌어다 놓아도 되고 눌러서 골라도 된다. 올리면 즉시 미리보기와 검사 결과가 같은 자리에
 * 나온다 — 다음 화면에 가서야 문제를 알면 처음부터 다시 해야 한다.
 */
function PhotoDrop({
  label,
  helpText,
  check,
  validation,
  onUploaded,
}: {
  label: string;
  helpText: string | null;
  check?: UploadCheck;
  validation: Record<string, unknown>;
  onUploaded: (uploadId: number, check: UploadCheck) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(file: File) {
    setError(null);
    setBusy(true);
    setPreview(URL.createObjectURL(file));
    try {
      const presigned = await generationApi.presign(file.name, file.type);
      await uploadDirect(presigned, file);
      const result = await generationApi.check(presigned.uploadId, {
        minWidth: validation.minWidth as number | undefined,
        minHeight: validation.minHeight as number | undefined,
      });
      onUploaded(presigned.uploadId, result);
    } catch (e) {
      setPreview(null);
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const messages = check ? Object.values(check.messages) : [];
  const failed = check?.status === "BLOCKED";

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handle(file);
        }}
        className={cn(
          "flex w-full items-center gap-4 rounded-xl border-2 border-dashed px-4 py-4 text-left transition-colors",
          dragging && "border-accent bg-accent/5",
          failed ? "border-[#c2564f]" : "border-line hover:border-ink-faint",
        )}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            className={cn("h-20 w-16 shrink-0 rounded-lg object-cover", busy && "opacity-50")}
          />
        ) : (
          <span className="flex h-20 w-16 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-faint">
            +
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium text-ink">
            {preview ? label : `${label} 올리기`}
          </span>
          <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-soft">
            {busy
              ? "확인하는 중이에요"
              : check?.status === "PASSED"
                ? "좋아요. 이대로 만들 수 있어요"
                : (helpText ?? "눌러서 고르거나 여기로 끌어다 놓으세요")}
          </span>
        </span>

        {check?.status === "PASSED" && <span className="shrink-0 text-accent">✓</span>}
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handle(file);
        }}
      />

      {messages.map((message) => (
        <p key={message} className={cn("mt-2 text-[12px]", failed ? "text-[#ff9b9b]" : "text-paid")}>
          {message}
        </p>
      ))}
      {error && <p className="mt-2 text-[12px] text-[#ff9b9b]">{error}</p>}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-sm px-4 py-28 text-center">{children}</div>;
}
