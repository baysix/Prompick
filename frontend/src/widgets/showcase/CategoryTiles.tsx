import Link from "next/link";
import type { TemplateCard } from "@/entities/template/model/types";

/**
 * 무엇부터 만들지 고르는 자리.
 *
 * 카테고리 이름만 나열하면 무엇이 나오는지 상상해야 한다. 그래서 각 칸에 그 카테고리의
 * 실제 결과물을 깔았다 — 고르는 판단이 글자가 아니라 그림으로 이뤄진다.
 *
 * 결과물이 없는 카테고리는 색만 깔린다. 비어 보이지 않게 하되, 있는 척하지는 않는다.
 */
const TONES = [
  "from-[#7a2ff2] to-[#b06ffb]",
  "from-[#00c4cc] to-[#5fe0d8]",
  "from-[#f2792f] to-[#f7b267]",
  "from-[#e0407a] to-[#f47ba6]",
  "from-[#2f6df2] to-[#6fa0fb]",
  "from-[#17a06b] to-[#5fd6a3]",
];

export function CategoryTiles({
  items,
}: {
  items: { slug: string; name: string; sample: TemplateCard | null }[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:py-16">
      <h2 className="text-[22px] font-bold tracking-tight text-ink sm:text-[26px]">
        무엇부터 만들어 볼까요
      </h2>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item, i) => (
          <Link
            key={item.slug}
            href={`/explore?category=${item.slug}`}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${TONES[i % TONES.length]}`}
              aria-hidden
            />

            {item.sample?.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.sample.thumbnailUrl}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
            )}

            {/*
              결과물 위에 카테고리 색을 얹는다. 결과물이 어두우면 칸이 죄다 비슷한 회색으로
              보여서 고르는 재미가 사라진다. 덮지 않고 섞어 원래 그림은 남긴다.
            */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${TONES[i % TONES.length]} mix-blend-soft-light opacity-90`}
              aria-hidden
            />

            {/* 아래쪽만 어둡게 덮어 이름이 읽히게 한다 */}
            <div
              className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent"
              aria-hidden
            />

            <span className="absolute inset-x-0 bottom-0 p-3 text-[14px] font-semibold text-white">
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
