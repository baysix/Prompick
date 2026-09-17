"use client";

import { useState } from "react";
import type { PromptAccess, PublicPrompt } from "../model/types";
import { LockIcon } from "./AccessBadge";
import { ViewPromptButton } from "./TemplateActions";

/**
 * 프롬프트 영역.
 *
 * 공개면 복사할 수 있는 모노스페이스 블록이고, 비공개면 실제로 가려진 표면이다.
 * 색을 하나 더 쓰지 않고 형태로 구분한다 — 색이 늘면 요금 배지의 의미가 흐려진다.
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
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="border border-line bg-ground-raised">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <h2 className="text-[13px] font-medium text-ink">프롬프트</h2>
        <button
          type="button"
          onClick={copy}
          className="rounded-sm bg-ink px-2.5 py-1 text-[12px] font-medium text-ground"
        >
          {copied ? "복사했어요" : "복사하기"}
        </button>
      </div>

      <div className="px-3 py-3">
        <p className="font-mono text-[12.5px] leading-relaxed text-ink">{prompt.body}</p>

        {prompt.negativePrompt && (
          <div className="mt-3 border-t border-line pt-3">
            <p className="text-[12px] text-ink-faint">빼야 할 것</p>
            <p className="mt-1 font-mono text-[12.5px] leading-relaxed text-ink-soft">
              {prompt.negativePrompt}
            </p>
          </div>
        )}
      </div>

      {(prompt.recommendedTool || prompt.usageTip) && (
        <div className="space-y-1.5 border-t border-line px-3 py-3">
          {prompt.recommendedTool && (
            <p className="text-[13px] text-ink-soft">
              <span className="text-ink-faint">어디에 쓰나요 </span>
              {prompt.recommendedTool}
            </p>
          )}
          {prompt.usageTip && (
            <p className="text-[13px] leading-relaxed text-ink-soft">{prompt.usageTip}</p>
          )}
        </div>
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
    <section className="border border-line bg-ground-raised">
      <div className="border-b border-line px-3 py-2">
        <h2 className="text-[13px] font-medium text-ink">프롬프트</h2>
      </div>
      <div className="relative px-3 py-3">
        <MaskLines />
        <div className="relative mt-3 flex flex-wrap items-center gap-2">
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
    <section className="border border-line bg-ground-raised">
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2 text-ink-faint">
        <LockIcon />
        <h2 className="text-[13px] font-medium">프롬프트를 제공하지 않아요</h2>
      </div>
      <div className="px-3 py-3">
        <MaskLines />
        <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
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
