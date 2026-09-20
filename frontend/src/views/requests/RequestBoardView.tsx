"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { requestApi, requestKeys } from "@/entities/request/api/requestApi";
import { isOpen, type TemplateRequest } from "@/entities/request/model/types";
import { ApiError } from "@/shared/api/client";
import { useSession } from "@/shared/auth/SessionProvider";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";

/**
 * 요청 게시판.
 *
 * 사용자에게는 "없는 걸 만들어 달라"는 창구이고, 운영자에게는 다음에 무엇을 만들지 알려주는
 * 신호다. 그래서 화면의 중심은 글이 아니라 추천 수다 — 요청 하나하나보다 "같은 걸 원하는
 * 사람이 몇 명인가"가 만들 순서를 정한다.
 *
 * 추천 버튼을 왼쪽 맨 앞에 크게 둔 것도 그래서다. 읽고 나서 누르는 것이 아니라, 훑다가 공감되면
 * 바로 누르는 동작이어야 한다.
 */
const SORTS = [
  { value: "VOTES", label: "많이 원하는 순" },
  { value: "LATEST", label: "최신순" },
] as const;

export function RequestBoardView() {
  const [sort, setSort] = useState<"VOTES" | "LATEST">("VOTES");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [writing, setWriting] = useState(false);
  const { signedIn } = useSession();

  const { data, isPending } = useQuery({
    queryKey: requestKeys.list(sort, onlyOpen),
    queryFn: () => requestApi.list(sort, onlyOpen),
  });

  const items = data ?? [];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {SORTS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSort(option.value)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-[13px] transition-colors",
                sort === option.value
                  ? "bg-white/8 font-semibold text-ink"
                  : "text-ink-soft hover:text-ink",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOnlyOpen(!onlyOpen)}
          aria-pressed={onlyOpen}
          className={cn(
            "rounded-lg border px-3 py-1.5 text-[13px] transition-colors",
            onlyOpen
              ? "border-accent bg-accent/12 font-semibold text-accent"
              : "border-line text-ink-soft hover:text-ink",
          )}
        >
          아직 안 만든 것만
        </button>

        <Button className="ml-auto" onClick={() => setWriting(true)}>
          요청하기
        </Button>
      </div>

      {writing && <WriteForm onClose={() => setWriting(false)} signedIn={signedIn} />}

      {isPending ? (
        <p className="py-16 text-center text-[13px] text-ink-faint">불러오는 중</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-line px-6 py-16 text-center">
          <p className="text-[15px] font-semibold text-ink">아직 올라온 요청이 없어요</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
            만들고 싶은데 없는 스타일이 있나요? 첫 번째로 올려보세요.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <RequestRow key={item.id} item={item} sort={sort} onlyOpen={onlyOpen} />
          ))}
        </ul>
      )}
    </div>
  );
}

function RequestRow({
  item,
  sort,
  onlyOpen,
}: {
  item: TemplateRequest;
  sort: "VOTES" | "LATEST";
  onlyOpen: boolean;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const { signedIn } = useSession();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: requestKeys.list(sort, onlyOpen) });

  const vote = useMutation({
    mutationFn: () => requestApi.vote(item.id),
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: () => requestApi.remove(item.id),
    onSettled: invalidate,
  });

  function handleVote() {
    if (!signedIn) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    vote.mutate();
  }

  return (
    <li className="flex gap-4 rounded-2xl border border-line p-4 sm:p-5">
      {/* 추천이 이 화면의 주인공이다. 읽기 전에 눈에 들어와야 한다 */}
      <button
        type="button"
        onClick={handleVote}
        disabled={vote.isPending}
        aria-pressed={item.votedByMe}
        className={cn(
          "flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl border transition-colors",
          item.votedByMe
            ? "border-accent bg-accent/12 text-accent"
            : "border-line text-ink-soft hover:border-ink-faint hover:text-ink",
        )}
      >
        <span aria-hidden className="text-[13px] leading-none">
          ▲
        </span>
        <span className="mt-1 font-mono text-[16px] font-semibold leading-none">
          {item.voteCount}
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip item={item} />
          <p className="text-[15px] font-semibold text-ink">{item.title}</p>
        </div>

        {item.description && (
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">{item.description}</p>
        )}

        {item.referenceUrl && (
          <a
            href={item.referenceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mt-2 inline-block max-w-full truncate text-[12px] text-accent hover:underline"
          >
            {item.referenceUrl}
          </a>
        )}

        {/* 운영자가 답을 남겼으면 눈에 띄게. 아무 말 없이 닫히면 다음부터 아무도 안 올린다 */}
        {item.adminNote && (
          <p className="mt-2.5 rounded-lg bg-white/5 px-3 py-2 text-[12px] leading-relaxed text-ink-soft">
            {item.adminNote}
          </p>
        )}

        {item.templateSlug && (
          <Link
            href={`/t/${item.templateSlug}`}
            className="mt-2.5 inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:underline"
          >
            만들어진 템플릿 보러 가기
          </Link>
        )}

        <p className="mt-2.5 text-[11px] text-ink-faint">
          {item.authorNickname} ·{" "}
          {new Date(item.createdAt).toLocaleDateString("ko-KR", {
            month: "long",
            day: "numeric",
          })}
          {item.mine && item.status === "PENDING" && (
            <>
              {" · "}
              <button
                type="button"
                onClick={() => remove.mutate()}
                disabled={remove.isPending}
                className="hover:text-ink"
              >
                지우기
              </button>
            </>
          )}
        </p>
      </div>
    </li>
  );
}

function StatusChip({ item }: { item: TemplateRequest }) {
  const tone =
    item.status === "DONE"
      ? "bg-accent/15 text-accent"
      : item.status === "REJECTED"
        ? "bg-white/6 text-ink-faint"
        : isOpen(item.status) && item.status !== "PENDING"
          ? "bg-paid/15 text-paid"
          : "bg-white/6 text-ink-soft";

  return (
    <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-semibold", tone)}>
      {item.statusLabel}
    </span>
  );
}

/** 요청 올리기. 링크 한 줄이면 충분하도록 만든다 */
function WriteForm({ onClose, signedIn }: { onClose: () => void; signedIn: boolean }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      requestApi.create({
        title: title.trim(),
        referenceUrl: url.trim() || null,
        description: description.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: requestKeys.all });
      onClose();
    },
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : "올리지 못했어요. 잠시 후 다시 해주세요."),
  });

  if (!signedIn) {
    return (
      <div className="mb-4 rounded-2xl border border-line p-5 text-center">
        <p className="text-[14px] text-ink">요청을 올리려면 로그인이 필요해요</p>
        <Button
          className="mt-4"
          onClick={() => router.push(`/login?next=${encodeURIComponent(pathname)}`)}
        >
          로그인
        </Button>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-line p-5">
      <p className="text-[15px] font-semibold text-ink">이런 거 만들어 주세요</p>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
        본 영상 링크를 남겨주시면 어떻게 만들었는지 분석해서 템플릿으로 만들어 드려요.
      </p>

      <div className="mt-4 space-y-2.5">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder="무엇을 만들고 싶나요? (예: 아기 사진으로 만드는 3D 미니미)"
          className="w-full rounded-xl bg-surface px-3.5 py-3 text-[14px] text-ink outline-none placeholder:text-ink-faint"
        />

        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          maxLength={500}
          placeholder="참고 링크 (인스타·틱톡·유튜브) — 선택"
          className="w-full rounded-xl bg-surface px-3.5 py-3 text-[14px] text-ink outline-none placeholder:text-ink-faint"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={3}
          placeholder="어떤 느낌이었으면 좋겠는지 적어주세요 — 선택"
          className="w-full rounded-xl bg-surface px-3.5 py-3 text-[14px] leading-relaxed text-ink outline-none placeholder:text-ink-faint"
        />
      </div>

      {error && <p className="mt-2.5 text-[13px] text-[#ff9b9b]">{error}</p>}

      <div className="mt-4 flex gap-2">
        <Button
          disabled={create.isPending || title.trim().length < 2}
          onClick={() => create.mutate()}
        >
          {create.isPending ? "올리는 중" : "올리기"}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          취소
        </Button>
      </div>
    </div>
  );
}
