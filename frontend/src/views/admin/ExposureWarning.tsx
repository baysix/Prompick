import Link from "next/link";
import type { AdminTemplate } from "@/entities/admin/model/types";

/**
 * 공개해도 되는지 알려주는 줄.
 *
 * 공개해놓고 아무 일도 일어나지 않는 템플릿이 가장 나쁘다 — 사용자는 돈을 내려다 막히고,
 * 운영자는 무엇이 빠졌는지 모른다. 그래서 무엇이 없는지 이름을 대서 말한다.
 */
export function missingParts(t: {
  promptAccess: AdminTemplate["promptAccess"];
  generateAccess: AdminTemplate["generateAccess"];
  hasPublicPrompt: boolean;
  hasActivePipeline: boolean;
  mediaCount: number;
}) {
  const missing: string[] = [];
  if (t.promptAccess !== "HIDDEN" && !t.hasPublicPrompt) missing.push("공개 프롬프트");
  if (!t.hasActivePipeline) missing.push("실행 파이프라인");
  if (t.mediaCount === 0) missing.push("예시 결과물");
  return missing;
}

export function ExposureWarning({
  template,
  templateId,
}: {
  template: Parameters<typeof missingParts>[0];
  templateId: number | null;
}) {
  const missing = missingParts(template);

  if (missing.length === 0) {
    return (
      <p className="rounded-lg bg-accent/10 px-3.5 py-2.5 text-[13px] text-accent">
        공개할 준비가 됐어요.
      </p>
    );
  }

  return (
    <div className="rounded-lg bg-paid/10 px-3.5 py-2.5">
      <p className="text-[13px] font-medium text-paid">
        {missing.join(" · ")}이(가) 아직 없어요
      </p>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">
        {template.generateAccess !== undefined && !template.hasActivePipeline
          ? "파이프라인이 없으면 사용자가 제작을 눌러도 아무것도 만들어지지 않아요. "
          : ""}
        {template.promptAccess !== "HIDDEN" && !template.hasPublicPrompt
          ? "프롬프트를 공개로 해두고 원문이 없으면 결제 후 빈 화면이 보여요. "
          : ""}
        {templateId !== null && (
          <Link href={`/admin/templates/${templateId}`} className="text-accent hover:underline">
            채우러 가기
          </Link>
        )}
      </p>
    </div>
  );
}
