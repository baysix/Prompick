"use client";

import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import type { PromptAccess, PublicPrompt } from "../model/types";
import { LockIcon } from "./AccessBadge";
import { ViewPromptButton } from "./TemplateActions";

/**
 * 프롬프트 영역.
 *
 * 공개면 복사해 가는 자리, 비공개면 가려진 표면이다. 색을 하나 더 쓰지 않고 형태로 구분한다 —
 * 색이 늘면 요금 배지의 의미가 흐려진다.
 *
 * 복사 버튼을 크게 둔 이유: 이 영역에 온 사람의 목적은 읽는 것이 아니라 가져가는 것이다.
 * 어디에 붙여넣는지도 같은 자리에서 알려준다. 프롬프트만 주고 "알아서 쓰세요"는
 * 받아 간 사람 절반을 막히게 한다.
 */
export function PromptBlock({
  slug,
  access,
  cost,
  prompt,
}: {
  slug: string;
  access: PromptAccess;
  cost: number;
  prompt: PublicPrompt | null;
}) {
  if (access === "HIDDEN") {
    return <MaskedPrompt />;
  }
  if (!prompt) {
    return <LockedPrompt slug={slug} access={access} cost={cost} />;
  }
  return <OpenPrompt prompt={prompt} />;
}

function OpenPrompt({ prompt }: { prompt: PublicPrompt }) {
  const [copied, setCopied] = useState<"body" | "negative" | null>(null);

  async function copy(text: string, which: "body" | "negative") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-line">
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <h2 className="text-[14px] font-semibold text-ink">프롬프트</h2>
        {prompt.recommendedTool && (
          <span className="text-[12px] text-ink-soft">{prompt.recommendedTool}에 붙여넣으세요</span>
        )}
        <button
          type="button"
          onClick={() => copy(prompt.body, "body")}
          className={cn(
            "ml-auto rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors",
            copied === "body" ? "bg-free-soft text-free" : "bg-accent text-accent-ink",
          )}
        >
          {copied === "body" ? "복사했어요" : "복사하기"}
        </button>
      </div>

      <div className="px-4 py-4">
        <p className="font-mono text-[13px] leading-relaxed text-ink">{prompt.body}</p>
      </div>

      {prompt.negativePrompt && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-ink-faint">빼야 할 것</p>
            <p className="mt-0.5 font-mono text-[12.5px] leading-relaxed text-ink-soft">
              {prompt.negativePrompt}
            </p>
          </div>
          <button
            type="button"
            onClick={() => copy(prompt.negativePrompt ?? "", "negative")}
            className="shrink-0 rounded-full border border-line px-3 py-1 text-[12px] text-ink"
          >
            {copied === "negative" ? "복사했어요" : "복사"}
          </button>
        </div>
      )}

      {prompt.usageTip && (
        <p className="border-t border-line bg-surface px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
          {prompt.usageTip}
        </p>
      )}
    </section>
  );
}

/** 아직 볼 수 없는 상태. 로그인이 필요하거나, 유료라 구매가 필요하다 */
function LockedPrompt({
  slug,
  access,
  cost,
}: {
  slug: string;
  access: PromptAccess;
  cost: number;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-line">
      <div className="border-b border-line bg-surface px-4 py-3">
        <h2 className="text-[14px] font-semibold text-ink">프롬프트</h2>
      </div>
      <div className="px-4 py-4">
        <MaskLines />
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <ViewPromptButton slug={slug} cost={cost} />
          <span className="text-[12px] text-ink-faint">
            {access === "FREE" ? "로그인하면 바로 볼 수 있어요" : "한 번 열면 계속 볼 수 있어요"}
          </span>
        </div>
      </div>
    </section>
  );
}

/** 비공개 프롬프트. 여기서만 만들 수 있는 템플릿 */
function MaskedPrompt() {
  return (
    <section className="overflow-hidden rounded-2xl border border-line">
      <div className="flex items-center gap-1.5 border-b border-line bg-surface px-4 py-3 text-ink-soft">
        <LockIcon />
        <h2 className="text-[14px] font-semibold">프롬프트를 제공하지 않아요</h2>
      </div>
      <div className="px-4 py-4">
        <MaskLines />
        <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">
          이 템플릿은 프롬프트만으로는 같은 결과가 나오지 않아요. 여러 단계를 거쳐 만들어지거든요.
          여기서 사진을 올려 만들어 보세요.
        </p>
      </div>
    </section>
  );
}

/** 가려진 텍스트 표면. 글자 모양만 남기고 읽을 수 없게 한다 */
function MaskLines() {
  const widths = ["92%", "78%", "88%", "54%"];
  return (
    <div className="space-y-2" aria-hidden>
      {widths.map((width, i) => (
        <div
          key={i}
          className="h-[11px] rounded-[2px] bg-[repeating-linear-gradient(90deg,var(--color-line)_0_10px,transparent_10px_16px)]"
          style={{ width }}
        />
      ))}
    </div>
  );
}
