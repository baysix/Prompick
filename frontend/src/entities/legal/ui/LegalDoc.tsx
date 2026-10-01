import type { ReactNode } from "react";

/**
 * 약관 문서의 뼈대.
 *
 * 이용약관과 개인정보처리방침이 같은 모양을 쓴다. 읽는 사람은 둘을 번갈아 보게 되는데
 * 생김새가 다르면 어디를 보고 있었는지 매번 다시 찾아야 한다.
 *
 * 시행일을 머리에 크게 둔다. 분쟁이 생겼을 때 가장 먼저 확인하는 것이 "언제부터 이 내용이
 * 적용됐나"인데, 그것이 본문 끝에 작게 적혀 있으면 찾지 못한다.
 */
export function LegalDoc({ version, children }: { version: string; children: ReactNode }) {
  return (
    <>
      <p className="mb-8 rounded-xl border border-line bg-surface px-4 py-3 text-[13px] text-ink-soft">
        시행일 <strong className="text-ink">{version}</strong>
      </p>
      <div className="space-y-8">{children}</div>
    </>
  );
}

/** 조항 하나 */
export function Article({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-[16px] font-bold tracking-[-0.02em] text-ink">{title}</h2>
      <div className="mt-2.5 space-y-2.5 text-[14px] leading-relaxed text-ink-soft">{children}</div>
    </section>
  );
}

/** 번호 없는 목록. 조항 안에서 항목을 늘어놓을 때 */
export function Items({ children }: { children: ReactNode }) {
  return <ul className="ml-4 list-disc space-y-1.5 marker:text-ink-faint">{children}</ul>;
}

/** 표. 수집 항목처럼 칸이 맞아야 읽히는 것에만 쓴다 */
export function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-line">
            {head.map((h) => (
              <th key={h} className="px-3 py-2.5 text-left font-semibold text-ink">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line/60">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2.5 align-top leading-relaxed text-ink-soft">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * 법률 검토 전이라는 표시.
 *
 * 초안을 올려두고 검토받은 척하지 않기 위해 둔다. 이 띠가 붙어 있는 동안에는 결제를 열지
 * 않는다 - 심사에서 막히기도 하지만, 그보다 지키지 못할 약속을 적어둔 채로 돈을 받는 일이
 * 되기 때문이다.
 */
export function DraftNotice() {
  return (
    <div className="mb-8 rounded-xl border border-paid/25 bg-paid/12 px-4 py-3 text-[13px] leading-relaxed text-paid">
      아직 법률 검토를 거치지 않은 초안이에요. 내용이 바뀔 수 있어요.
    </div>
  );
}
