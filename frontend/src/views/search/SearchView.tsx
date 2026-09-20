"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { templateApi, templateKeys } from "@/entities/template/api/templateApi";
import { TemplateTile } from "@/entities/template/ui/TemplateTile";
import { Button } from "@/shared/ui/Button";

/** 검색. 주소가 바뀌면 입력칸도 그 검색어에서 다시 시작하도록 key로 새로 만든다 */
export function SearchView() {
  const submitted = useSearchParams().get("q") ?? "";
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
    <main className="flex-1">
      <div className="mx-auto max-w-[1280px] px-4 py-6">
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
            className="min-w-0 flex-1 rounded-xl bg-surface px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink-faint"
          />
          <Button type="submit" size="lg" className="shrink-0">
            검색
          </Button>
        </form>

        <div className="pt-6">
          {!submitted ? (
            <Message title="무엇을 만들고 싶나요" body="제목, 설명, 태그에서 찾아요." />
          ) : isError ? (
            <Message title="검색에 실패했어요" body="잠시 후 다시 시도해 주세요." />
          ) : isPending ? (
            <p className="py-20 text-center text-[13px] text-ink-faint">찾는 중</p>
          ) : data && data.length > 0 ? (
            <>
              <p className="pb-4 text-[13px] text-ink-soft">{data.length}개를 찾았어요</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {data.map((template, i) => (
                  <TemplateTile
                    key={template.slug}
                    template={template}
                    priority={i < 8}
                  />
                ))}
              </div>
            </>
          ) : (
            <Message title="찾는 결과가 없어요" body="다른 말로 검색하거나 탐색에서 둘러보세요." />
          )}
        </div>
      </div>
    </main>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="py-24 text-center">
      <p className="text-[16px] font-semibold text-ink">{title}</p>
      <p className="mt-1.5 text-[14px] text-ink-soft">{body}</p>
    </div>
  );
}
