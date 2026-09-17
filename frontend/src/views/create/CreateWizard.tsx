"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { generationApi, generationKeys, uploadDirect } from "@/entities/generation/api/generationApi";
import type { UploadCheck } from "@/entities/generation/model/types";
import type { TemplateDetail } from "@/entities/template/model/types";
import { ApiError } from "@/shared/api/client";
import { useSession } from "@/shared/auth/SessionProvider";
import { cn } from "@/shared/lib/cn";

type Step = "guide" | "upload" | "options" | "confirm";

const STEPS: { key: Step; label: string }[] = [
  { key: "guide", label: "가이드" },
  { key: "upload", label: "사진" },
  { key: "options", label: "선택" },
  { key: "confirm", label: "확인" },
];

/**
 * 만들기 마법사.
 *
 * 한 화면에 다 넣지 않고 네 단계로 나눈다. 촬영 가이드를 먼저 읽게 해야 실패가 줄고,
 * 실패가 줄어야 환불과 원가 손실이 준다. 가이드는 친절이 아니라 비용 방어에 가깝다.
 */
export function CreateWizard({ template }: { template: TemplateDetail }) {
  const router = useRouter();
  const { signedIn, loading } = useSession();

  const [step, setStep] = useState<Step>("guide");
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [checks, setChecks] = useState<Record<string, UploadCheck>>({});
  const [error, setError] = useState<string | null>(null);

  // 요청마다 새로 만들지 않고 화면에 들어올 때 한 번만 만든다.
  // 버튼을 두 번 눌러도 같은 키가 가서 작업이 하나만 생긴다.
  const [idempotencyKey] = useState(
    () => `${template.slug}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  );

  const { data: freeUsage } = useQuery({
    queryKey: generationKeys.freeUsage(),
    queryFn: () => generationApi.freeUsage(),
    enabled: signedIn,
  });

  const imageFields = template.inputFields.filter((f) => f.fieldType === "IMAGE");
  const optionFields = template.inputFields.filter((f) => f.fieldType !== "IMAGE");

  const create = useMutation({
    mutationFn: () => generationApi.create(template.slug, values, idempotencyKey),
    onSuccess: (job) => router.push(`/jobs/${job.id}`),
    onError: (e) => setError(e instanceof ApiError ? e.message : "요청하지 못했어요."),
  });

  if (loading) {
    return <Center>확인 중</Center>;
  }

  if (!signedIn) {
    return (
      <Center>
        <p className="text-[15px] font-semibold text-ink">로그인이 필요해요</p>
        <Link
          href={`/login?next=${encodeURIComponent(`/t/${template.slug}/create`)}`}
          className="mt-4 inline-block rounded-full bg-accent px-4 py-2 text-[14px] font-semibold text-accent-ink"
        >
          로그인
        </Link>
      </Center>
    );
  }

  const isFree = template.generateAccess === "FREE";
  const noFreeLeft = isFree && freeUsage != null && freeUsage.remaining <= 0;
  const missingImages = imageFields.filter((f) => f.required && !values[f.fieldKey]);
  const blocked = Object.values(checks).some((c) => c.status === "BLOCKED");

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-7">
        <Link href={`/t/${template.slug}`} className="text-[13px] text-ink-soft hover:text-ink">
          ← {template.title}
        </Link>
        <ol className="mt-4 flex items-center gap-1.5">
          {STEPS.map((s, i) => {
            const currentIndex = STEPS.findIndex((x) => x.key === step);
            const state = i < currentIndex ? "done" : i === currentIndex ? "current" : "todo";
            return (
              <li key={s.key} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-[12px]",
                    state === "current" && "bg-ink font-semibold text-ground",
                    state === "done" && "bg-surface text-ink",
                    state === "todo" && "text-ink-faint",
                  )}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && <span className="h-px w-3 bg-line" />}
              </li>
            );
          })}
        </ol>
      </header>

      {step === "guide" && (
        <Section title="이렇게 찍어 주세요" description={template.requiredPhotoSummary ?? undefined}>
          {template.uploadGuide?.checklist && (
            <ul className="space-y-2">
              {template.uploadGuide.checklist.map((item) => (
                <li key={item} className="flex gap-2.5 text-[14px] leading-relaxed text-ink-soft">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          )}
          {template.uploadGuide?.resultNote && (
            <p className="mt-5 rounded-xl bg-surface px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
              {template.uploadGuide.resultNote}
            </p>
          )}
          <Next
            onClick={() =>
              setStep(
                imageFields.length > 0
                  ? "upload"
                  : optionFields.length > 0
                    ? "options"
                    : "confirm",
              )
            }
          >
            {imageFields.length > 0 ? "사진 올리러 가기" : "다음"}
          </Next>
        </Section>
      )}

      {step === "upload" && (
        <Section title="사진을 올려주세요">
          {imageFields.length === 0 && (
            <p className="rounded-xl bg-surface px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
              이 템플릿은 아직 올릴 사진이 정해지지 않았어요. 관리자가 입력 항목을 등록하면
              여기에 나타나요.
            </p>
          )}
          <div className="space-y-4">
            {imageFields.map((field) => (
              <ImageField
                key={field.fieldKey}
                label={field.label}
                helpText={field.helpText}
                check={checks[field.fieldKey]}
                onUploaded={(uploadId, check) => {
                  setValues((v) => ({ ...v, [field.fieldKey]: uploadId }));
                  setChecks((c) => ({ ...c, [field.fieldKey]: check }));
                }}
                validation={field.validation}
              />
            ))}
          </div>
          <Next
            disabled={missingImages.length > 0 || blocked}
            onClick={() => setStep(optionFields.length > 0 ? "options" : "confirm")}
          >
            {blocked ? "다른 사진으로 바꿔주세요" : "다음"}
          </Next>
        </Section>
      )}

      {step === "options" && (
        <Section title="어떻게 만들까요">
          <div className="space-y-4">
            {optionFields.map((field) => (
              <div key={field.fieldKey} className="space-y-1.5">
                <label className="block text-[13px] font-medium text-ink">{field.label}</label>
                {field.helpText && (
                  <p className="text-[12px] text-ink-soft">{field.helpText}</p>
                )}
                {field.fieldType === "SELECT" ? (
                  <div className="flex flex-wrap gap-1.5">
                    {field.options.map((option) => {
                      const selected = values[field.fieldKey] === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setValues((v) => ({ ...v, [field.fieldKey]: option.value }))
                          }
                          className={cn(
                            "rounded-full border px-3.5 py-1.5 text-[13px]",
                            selected
                              ? "border-ink bg-ink font-medium text-ground"
                              : "border-line text-ink-soft hover:text-ink",
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
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.fieldKey]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-line bg-ground px-3.5 py-2.5 text-[14px]"
                  />
                )}
              </div>
            ))}
          </div>
          <Next onClick={() => setStep("confirm")}>다음</Next>
        </Section>
      )}

      {step === "confirm" && (
        <Section title="이대로 만들까요">
          <dl className="divide-y divide-line rounded-xl border border-line">
            <Row label="템플릿" value={template.title} />
            <Row
              label="비용"
              value={isFree ? "무료" : `🪙 ${template.generateCost.toLocaleString()}`}
            />
            {isFree && freeUsage && (
              <Row label="오늘 남은 횟수" value={`${freeUsage.remaining}회 / ${freeUsage.dailyLimit}회`} />
            )}
            <Row label="걸리는 시간" value={`약 ${Math.round(template.estimatedSeconds / 60)}분`} />
          </dl>

          {noFreeLeft ? (
            <p className="mt-5 rounded-xl bg-surface px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
              오늘 무료 횟수를 다 썼어요. 내일 자정에 다시 채워져요.
            </p>
          ) : (
            <p className="mt-5 text-[13px] leading-relaxed text-ink-soft">
              만드는 동안 이 화면을 닫아도 괜찮아요. 다 되면 작업함에서 확인할 수 있어요.
              실패하면 쓴 만큼 돌려드려요.
            </p>
          )}

          {error && (
            <p className="mt-4 border-l-2 border-[#c2410c] pl-3 text-[13px] text-[#c2410c]">
              {error}
            </p>
          )}

          <Next
            disabled={create.isPending || noFreeLeft}
            onClick={() => create.mutate()}
          >
            {create.isPending ? "요청하는 중" : isFree ? "무료로 만들기" : `🪙 ${template.generateCost}으로 만들기`}
          </Next>
        </Section>
      )}
    </div>
  );
}

function ImageField({
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
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(file: File) {
    setError(null);
    setBusy(true);
    try {
      const presigned = await generationApi.presign(file.name, file.type);
      await uploadDirect(presigned, file);

      const result = await generationApi.check(presigned.uploadId, {
        minWidth: validation.minWidth as number | undefined,
        minHeight: validation.minHeight as number | undefined,
      });

      setPreview(URL.createObjectURL(file));
      onUploaded(presigned.uploadId, result);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const messages = check ? Object.values(check.messages) : [];

  return (
    <div className="rounded-xl border border-line p-4">
      <p className="text-[13px] font-medium text-ink">{label}</p>
      {helpText && <p className="mt-0.5 text-[12px] text-ink-soft">{helpText}</p>}

      <div className="mt-3 flex items-start gap-4">
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-24 w-20 rounded-lg border border-line object-cover" />
        )}
        <div className="min-w-0 flex-1">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handle(file);
            }}
            className="w-full text-[13px] text-ink-soft file:mr-2 file:rounded-full file:border-0 file:bg-surface file:px-3 file:py-1.5 file:text-[13px] file:text-ink"
          />
          {busy && <p className="mt-2 text-[12px] text-ink-faint">확인하는 중</p>}

          {check?.status === "PASSED" && (
            <p className="mt-2 text-[12px] text-free">좋아요. 이 사진으로 만들 수 있어요</p>
          )}
          {messages.map((message) => (
            <p
              key={message}
              className={cn(
                "mt-2 text-[12px]",
                check?.status === "BLOCKED" ? "text-[#c2410c]" : "text-paid",
              )}
            >
              {message}
            </p>
          ))}
          {error && <p className="mt-2 text-[12px] text-[#c2410c]">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h1 className="text-[20px] font-bold tracking-tight text-ink">{title}</h1>
      {description && <p className="mt-1 text-[14px] text-ink-soft">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Next({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-7 w-full rounded-full bg-accent py-3 text-[15px] font-semibold text-accent-ink disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <dt className="text-[13px] text-ink-soft">{label}</dt>
      <dd className="ml-auto text-[14px] font-medium text-ink">{value}</dd>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-sm px-4 py-24 text-center">{children}</div>;
}
