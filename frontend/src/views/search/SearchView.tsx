"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { templateApi, templateKeys } from "@/entities/template/api/templateApi";
import { TemplateFrame } from "@/entities/template/ui/TemplateFrame";

export function SearchView() {
  const params = useSearchParams();
  const submitted = params.get("q") ?? "";

  // 주소가 바뀌면 입력칸도 그 검색어에서 다시 시작해야 한다.
  // effect로 맞추는 대신 key로 컴포넌트를 새로 만든다.
  return <SearchBody key={submitted} submitted={submitted} />;
}

function SearchBody({ submitted }: { submitted: string }) {
  const router = useRouter();
  const [input, setInput] = useState(submitted);

  const { data, isPending, isError } = useQuery({
    queryKey: templateKeys.search(submitted),
    queryFn: () => templateApi.search(submitted),
    enabled: submitted.trim().length > 0,
  });

  return (
    <main className="flex-1 pb-20">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            router.replace(`/search?q=${encodeURIComponent(input.trim())}`);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="제품 광고, 필름 프로필, 시네마틱…"
            aria-label="템플릿 검색"
            className="min-w-0 flex-1 border border-line bg-ground-raised px-3 py-2.5 text-[14px] text-ink placeholder:text-ink-faint"
          />
          <button
            type="submit"
            className="shrink-0 rounded-sm bg-ink px-4 py-2.5 text-[14px] font-medium text-ground"
          >
            검색
          </button>
        </form>

        <div className="pt-6">
          {!submitted ? (
            <p className="py-16 text-[13px] text-ink-soft">
              만들고 싶은 걸 검색해 보세요. 제목, 설명, 태그에서 찾아요.
            </p>
          ) : isError ? (
            <p className="py-16 text-[13px] text-ink-soft">검색에 실패했어요. 잠시 후 다시 시도해 주세요.</p>
          ) : isPending ? (
            <p className="py-16 text-[13px] text-ink-faint">찾는 중</p>
          ) : data && data.length > 0 ? (
            <>
              <p className="pb-4 text-[13px] text-ink-soft">{data.length}개를 찾았어요</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
                {data.map((template, i) => (
                  <TemplateFrame key={template.slug} template={template} priority={i < 6} />
                ))}
              </div>
            </>
          ) : (
            <div className="py-16">
              <p className="text-[15px] font-medium text-ink">찾는 결과가 없어요</p>
              <p className="mt-1 text-[13px] text-ink-soft">
                다른 말로 검색하거나 탐색에서 둘러보세요.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
