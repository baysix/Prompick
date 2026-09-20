"use client";

import { useState } from "react";
import { useSession } from "@/shared/auth/SessionProvider";
import { cn } from "@/shared/lib/cn";
import { Button, ButtonLink } from "@/shared/ui/Button";
import type { PromptAccess, PublicPrompt } from "../model/types";

/**
 * 프롬프트 영역.
 *
 * 공개면 복사해 가는 자리, 비공개면 가려진 표면이다. 색을 하나 더 쓰지 않고 형태로 구분한다.
 *
 * 복사 버튼을 크게 둔 이유: 이 자리에 온 사람의 목적은 읽는 것이 아니라 가져가는 것이다.
 * 어디에 붙여넣는지도 같은 줄에 적는다. 프롬프트만 주고 "알아서 쓰세요"는 받아 간 사람
 * 절반을 막히게 한다.
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
  if (access === "HIDDEN") return <Masked />;
  if (!prompt) return <Locked slug={slug} access={access} cost={cost} />;
  return <Open prompt={prompt} />;
}

function Open({ prompt }: { prompt: PublicPrompt }) {
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
    <section className="overflow-hidden rounded-xl border border-line">
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-white/[0.03] px-4 py-3">
        <h2 className="text-[14px] font-semibold text-ink">프롬프트</h2>
        {prompt.recommendedTool && (
          <span className="text-[12px] text-ink-soft">{prompt.recommendedTool}에 붙여넣으세요</span>
        )}
        <Button
          size="sm"
          variant={copied === "body" ? "secondary" : "primary"}
          onClick={() => copy(prompt.body, "body")}
          className="ml-auto"
        >
          {copied === "body" ? "복사했어요" : "복사하기"}
        </Button>
      </div>

      <p className="px-4 py-4 font-mono text-[13px] leading-relaxed text-ink">{prompt.body}</p>

      {prompt.negativePrompt && (
        <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] text-ink-faint">빼야 할 것</p>
            <p className="mt-0.5 font-mono text-[12.5px] leading-relaxed text-ink-soft">
              {prompt.negativePrompt}
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => copy(prompt.negativePrompt ?? "", "negative")}
          >
            {copied === "negative" ? "복사함" : "복사"}
          </Button>
        </div>
      )}

      {prompt.usageTip && (
        <p className="border-t border-line bg-white/[0.02] px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
          {prompt.usageTip}
        </p>
      )}
    </section>
  );
}

/** 아직 볼 수 없는 상태. 로그인이 필요하거나 유료라 구매가 필요하다 */
function Locked({ slug, access, cost }: { slug: string; access: PromptAccess; cost: number }) {
  const { signedIn } = useSession();

  return (
    <section className="overflow-hidden rounded-xl border border-line">
      <div className="border-b border-line bg-white/[0.03] px-4 py-3">
        <h2 className="text-[14px] font-semibold text-ink">프롬프트</h2>
      </div>
      <div className="px-4 py-4">
        <MaskLines />
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {!signedIn ? (
            <ButtonLink href={`/login?next=${encodeURIComponent(`/t/${slug}`)}`} size="sm">
              로그인하고 보기
            </ButtonLink>
          ) : (
            <Button size="sm">
              <span aria-hidden>🪙</span> {cost.toLocaleString()}으로 열어보기
            </Button>
          )}
          <span className="text-[12px] text-ink-faint">
            {access === "FREE" ? "로그인하면 바로 볼 수 있어요" : "한 번 열면 계속 볼 수 있어요"}
          </span>
        </div>
      </div>
    </section>
  );
}

/** 비공개. 여기서만 만들 수 있는 템플릿 */
function Masked() {
  return (
    <section className="overflow-hidden rounded-xl border border-line">
      <div className="flex items-center gap-1.5 border-b border-line bg-white/[0.03] px-4 py-3 text-ink-soft">
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
  return (
    <div className="space-y-2" aria-hidden>
      {["92%", "78%", "88%", "54%"].map((width, i) => (
        <div
          key={i}
          className={cn(
            "h-[11px] rounded-[3px]",
            "bg-[repeating-linear-gradient(90deg,var(--color-surface-2)_0_10px,transparent_10px_16px)]",
          )}
          style={{ width }}
        />
      ))}
    </div>
  );
}

export function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={cn("h-3.5 w-3.5", className)}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden
    >
      <rect x="2.5" y="5.5" width="7" height="5" rx="1" />
      <path d="M4.2 5.5V4a1.8 1.8 0 0 1 3.6 0v1.5" />
    </svg>
  );
}
