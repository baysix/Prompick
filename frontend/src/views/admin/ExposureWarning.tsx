import type { TemplateFormValues } from "@/entities/admin/model/types";

/**
 * 사용자에게 보이는 글에 AI 모델명이 들어갔는지 알린다.
 *
 * 시스템은 파이프라인을 절대 내보내지 않지만, 관리자가 제목이나 설명에 "Higgsfield로 만든"처럼
 * 직접 적어 버리면 그 방어가 의미를 잃는다. 막지는 않고 알려만 준다 — 판단은 사람이 한다.
 */
const MODEL_WORDS = [
  "gpt",
  "openai",
  "gemini",
  "veo",
  "higgsfield",
  "runway",
  "kling",
  "midjourney",
  "sora",
  "dall",
  "claude",
  "stable diffusion",
];

export function ExposureWarning({ value }: { value: TemplateFormValues }) {
  const userVisible = [
    ["제목", value.title],
    ["설명", value.description],
    ["주소", value.slug],
    ["필요한 사진", value.requiredPhotoSummary],
    ["태그", value.tags.join(" ")],
  ] as const;

  const hits = userVisible.flatMap(([label, text]) => {
    const found = MODEL_WORDS.filter((w) => text.toLowerCase().includes(w));
    return found.length > 0 ? [{ label, found }] : [];
  });

  if (hits.length === 0) return null;

  return (
    <div className="border-l-2 border-paid bg-paid-soft/40 py-2 pl-3 pr-2">
      <p className="text-[13px] font-medium text-ink">사용자에게 보이는 글에 AI 이름이 있어요</p>
      <ul className="mt-1 space-y-0.5">
        {hits.map((h) => (
          <li key={h.label} className="text-[12px] text-ink-soft">
            {h.label}: {h.found.join(", ")}
          </li>
        ))}
      </ul>
      <p className="mt-1.5 text-[12px] text-ink-soft">
        어떤 AI를 쓰는지는 감추는 게 이 서비스의 전제예요. 꼭 필요한 게 아니면 빼주세요.
      </p>
    </div>
  );
}
