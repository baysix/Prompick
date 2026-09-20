"use client";

import { useEffect, useState } from "react";
import { TemplateTile } from "@/entities/template/ui/TemplateTile";
import type { TemplateCard } from "@/entities/template/model/types";

/**
 * 메이슨리 격자.
 *
 * 칸을 직접 나눈다. CSS columns는 칸마다 높이를 맞추려 들기 때문에, 세로로 긴 타일이
 * 섞이면 앞 칸에 몰아넣고 뒤쪽 칸을 통째로 비워둔다. 결과물이 적을수록 그 일이 잦고,
 * 빈 칸 하나가 화면을 고장난 것처럼 보이게 한다.
 *
 * 타일 높이는 각자 올라온 그림이 정하므로 여기서는 칸만 나눈다.
 *
 * 그래서 몇 칸으로 나눌지 직접 정하고, 결과물을 앞에서부터 한 칸씩 돌아가며 넣는다.
 * 칸 수는 결과물 수를 넘지 않으므로 빈 칸이 생길 수 없다. 돌아가며 넣으므로 맨 윗줄은
 * 목록 순서대로 읽힌다 — 가장 먼저 보여주고 싶은 것이 맨 위에 남는다.
 *
 * 결과물이 칸 수보다 적으면 격자 자체를 좁힌다. 칸만 줄이고 폭을 그대로 두면 세 장일 때
 * 한 장이 화면의 3분의 1을 차지해서, 고르는 화면이 아니라 감상하는 화면이 된다. 폭을
 * 줄이면 타일 크기는 언제나 같고 오른쪽이 비는데, 이쪽이 훨씬 덜 어색하다.
 */
const BREAKPOINTS = [
  { query: "(min-width: 1280px)", columns: 5 },
  { query: "(min-width: 1024px)", columns: 4 },
  { query: "(min-width: 640px)", columns: 3 },
];

export function MasonryGrid({ items }: { items: TemplateCard[] }) {
  const columns = useColumnCount();
  const used = Math.min(columns, items.length);

  // 앞에서부터 한 칸씩 돌아가며 넣는다
  const buckets: TemplateCard[][] = Array.from({ length: used }, () => []);
  items.forEach((item, i) => buckets[i % used].push(item));

  return (
    <div
      className="flex gap-2"
      style={used < columns ? { maxWidth: `${(used / columns) * 100}%` } : undefined}
    >
      {buckets.map((bucket, column) => (
        <div key={column} className="flex min-w-0 flex-1 flex-col gap-2">
          {/* 높이는 각 타일이 올라온 그림의 비율로 스스로 정한다 */}
          {bucket.map((template, row) => (
            <TemplateTile key={template.slug} template={template} priority={row === 0} />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * 지금 화면 폭에 맞는 칸 수.
 *
 * 서버에서는 폭을 알 수 없으므로 좁은 화면(2칸)으로 그려 내려보낸다. 좁게 그린 것을
 * 넓히는 것은 괜찮지만, 넓게 그렸다가 좁히면 첫 그림에서 가로 스크롤이 생긴다.
 */
function useColumnCount() {
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    const lists = BREAKPOINTS.map((b) => window.matchMedia(b.query));

    const apply = () => {
      const matched = BREAKPOINTS.find((_, i) => lists[i].matches);
      setColumns(matched?.columns ?? 2);
    };

    apply();
    lists.forEach((list) => list.addEventListener("change", apply));
    return () => lists.forEach((list) => list.removeEventListener("change", apply));
  }, []);

  return columns;
}
