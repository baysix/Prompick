"use client";

import { useState } from "react";
import type { TemplateDetail } from "../model/types";
import { cn } from "@/shared/lib/cn";

/**
 * 템플릿 상세의 안내 두 가지.
 *
 * 읽는 목적이 반대인 글이 둘 있다.
 *
 *   맡기기 — 우리가 만들어 줄 테니 사진을 이렇게 올려라
 *   직접 만들기 — 저기 가서 이 순서로 눌러라
 *
 * 한 덩어리로 쌓아두면 둘 다 읽히지 않는다. 맡기러 온 사람에게는 직접 만드는 법이
 * 방해가 되고, 직접 해보려는 사람에게는 사진 규격이 그렇다. 그래서 탭으로 나눈다.
 *
 * 직접 만드는 법이 없는 템플릿이 대부분이다. 그럴 때는 탭을 그리지 않고 기존처럼
 * 사진 안내만 보여준다 — 탭이 하나뿐이면 누를 것이 없는데 자리만 차지한다.
 */
export function GuideTabs({ template }: { template: TemplateDetail }) {
  const upload = template.uploadGuide;
  const self = template.selfGuide;

  const hasUpload = (upload?.checklist?.length ?? 0) > 0 || Boolean(upload?.resultNote);
  const hasSelf = (self?.steps?.length ?? 0) > 0 || Boolean(self?.intro);

  const [tab, setTab] = useState<"upload" | "self">(hasUpload ? "upload" : "self");

  if (!hasUpload && !hasSelf) return null;

  // 한쪽만 있으면 탭 없이 그것만 보여준다.
  if (!hasSelf) return <section>{<UploadGuide guide={upload} />}</section>;
  if (!hasUpload) return <section>{<SelfGuide guide={self!} />}</section>;

  return (
    <section>
      <div className="flex gap-1 border-b border-line">
        <Tab active={tab === "upload"} onClick={() => setTab("upload")}>
          맡기고 받기
        </Tab>
        <Tab active={tab === "self"} onClick={() => setTab("self")}>
          직접 만들기
        </Tab>
      </div>
      <div className="pt-5">
        {tab === "upload" ? <UploadGuide guide={upload} /> : <SelfGuide guide={self!} />}
      </div>
    </section>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-selected={active}
      role="tab"
      className={cn(
        "-mb-px border-b-2 px-3.5 py-2.5 text-[14px] transition-colors",
        active
          ? "border-accent font-semibold text-ink"
          : "border-transparent text-ink-soft hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

/** 우리에게 맡길 때 — 사진을 어떻게 올려야 하는지 */
function UploadGuide({ guide }: { guide: TemplateDetail["uploadGuide"] }) {
  return (
    <>
      <h2 className="text-[15px] font-semibold text-ink">이렇게 찍어 주세요</h2>
      <ul className="mt-3 space-y-2">
        {(guide?.checklist ?? []).map((item) => (
          <li key={item} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-soft">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
            {item}
          </li>
        ))}
      </ul>
      {guide?.resultNote && (
        <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-[13px] leading-relaxed text-ink-soft">
          {guide.resultNote}
        </p>
      )}
    </>
  );
}

/**
 * 직접 만들 때 — 어디 가서 어떤 순서로 누르는지.
 *
 * 단계에 번호를 매겨 보여준다. 운영자는 한 줄에 하나씩 적기만 하면 된다.
 */
function SelfGuide({ guide }: { guide: NonNullable<TemplateDetail["selfGuide"]> }) {
  return (
    <>
      <h2 className="text-[15px] font-semibold text-ink">
        {guide.toolName ? `${guide.toolName}에서 직접 만들기` : "직접 만들기"}
      </h2>

      {guide.intro && (
        <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">{guide.intro}</p>
      )}

      {(guide.steps?.length ?? 0) > 0 && (
        <ol className="mt-4 space-y-2.5">
          {guide.steps!.map((step, i) => (
            <li key={step} className="flex gap-3 text-[13px] leading-relaxed text-ink-soft">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/8 text-[11px] font-bold text-ink-soft">
                {i + 1}
              </span>
              <span className="min-w-0">{step}</span>
            </li>
          ))}
        </ol>
      )}

      {(guide.tips?.length ?? 0) > 0 && (
        <ul className="mt-4 space-y-2">
          {guide.tips!.map((tip) => (
            <li key={tip} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-soft">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-accent" />
              {tip}
            </li>
          ))}
        </ul>
      )}

      {guide.costNote && (
        <p className="mt-4 rounded-xl border border-paid/25 bg-paid/10 px-4 py-3 text-[13px] leading-relaxed text-paid">
          {guide.costNote}
        </p>
      )}

      {guide.toolUrl && (
        <a
          href={guide.toolUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white/8 px-4 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:bg-white/12"
        >
          {guide.toolName ?? "도구"} 열기 <span aria-hidden>↗</span>
        </a>
      )}
    </>
  );
}
