"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { generationApi, generationKeys } from "@/entities/generation/api/generationApi";
import { isFinished, type Job } from "@/entities/generation/model/types";
import { useSession } from "@/shared/auth/SessionProvider";

/**
 * 제작 진행과 결과.
 *
 * 끝날 때까지 서버에 상태를 물어본다. 끝나면 멈춘다 — 완료된 작업을 계속 물어보는 것은
 * 사용자의 데이터와 서버 자원을 함께 낭비한다.
 */
export function JobView({ jobId }: { jobId: number }) {
  const { signedIn, loading } = useSession();

  const { data: job, isError } = useQuery({
    queryKey: generationKeys.job(jobId),
    queryFn: () => generationApi.job(jobId),
    enabled: signedIn,
    refetchInterval: (query) => {
      const current = query.state.data;
      return current && isFinished(current.status) ? false : 3000;
    },
  });

  if (loading) return <Center>확인 중</Center>;

  if (!signedIn) {
    return (
      <Center>
        <p className="text-[15px] font-semibold text-ink">로그인이 필요해요</p>
        <Link
          href={`/login?next=${encodeURIComponent(`/jobs/${jobId}`)}`}
          className="bg-brand mt-4 inline-block rounded-full px-4 py-2 text-[14px] font-semibold text-accent-ink"
        >
          로그인
        </Link>
      </Center>
    );
  }

  if (isError) return <Center>작업을 찾을 수 없어요</Center>;
  if (!job) return <Center>불러오는 중</Center>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/my/jobs" className="text-[13px] text-ink-soft hover:text-ink">
        ← 내 작업함
      </Link>

      <h1 className="mt-4 text-[22px] font-bold tracking-tight text-ink">{job.templateTitle}</h1>

      {job.status === "SUCCEEDED" ? (
        <Succeeded job={job} />
      ) : job.status === "FAILED" ? (
        <Failed job={job} />
      ) : (
        <Running job={job} />
      )}
    </div>
  );
}

function Running({ job }: { job: Job }) {
  const percent = job.totalSteps > 0 ? Math.round((job.currentStep / job.totalSteps) * 100) : 0;

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-line p-6">
        <p className="text-[15px] font-medium text-ink">{job.statusMessage}</p>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-700"
            style={{ width: `${Math.max(percent, 8)}%` }}
          />
        </div>

        <p className="mt-2.5 text-[12px] text-ink-faint">
          {job.totalSteps > 1 && `${job.currentStep + 1}번째 단계 / 전체 ${job.totalSteps}단계 · `}
          이 화면을 닫아도 계속 만들어져요
        </p>
      </div>

      <p className="mt-5 text-[13px] leading-relaxed text-ink-soft">
        다 되면 작업함에 쌓여요. 실패하면 쓴 만큼 돌려드려요.
      </p>
    </div>
  );
}

function Succeeded({ job }: { job: Job }) {
  const output = job.outputs[0];

  return (
    <div className="mt-6">
      {output && (
        <figure className="overflow-hidden rounded-2xl border border-line bg-surface">
          {output.mediaType === "VIDEO" && /\.(mp4|webm)(\?|$)/i.test(output.url) ? (
            <video src={output.url} controls autoPlay loop muted playsInline className="w-full" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={output.url} alt="" className="w-full" />
          )}
        </figure>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {output && (
          <a
            href={output.url}
            download
            className="bg-brand rounded-full px-5 py-2.5 text-[14px] font-semibold text-accent-ink"
          >
            내려받기
          </a>
        )}
        {job.templateSlug && (
          <Link
            href={`/t/${job.templateSlug}/create`}
            className="rounded-full border border-line px-5 py-2.5 text-[14px] font-medium text-ink"
          >
            다시 만들기
          </Link>
        )}
        <Link
          href="/explore"
          className="rounded-full px-5 py-2.5 text-[14px] text-ink-soft hover:text-ink"
        >
          다른 것도 보기
        </Link>
      </div>

      <ul className="mt-6 space-y-1.5 text-[12px] leading-relaxed text-ink-faint">
        {output?.watermarked && <li>무료로 만든 결과물에는 표시가 들어가요.</li>}
        <li>결과물은 30일 동안 보관해요. 그 전에 내려받아 주세요.</li>
      </ul>
    </div>
  );
}

function Failed({ job }: { job: Job }) {
  const timedOut = job.errorCode === "GENERATION_TIMEOUT";

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-line p-6">
        <p className="text-[15px] font-medium text-ink">
          {timedOut ? "시간이 너무 오래 걸려 멈췄어요" : "만들지 못했어요"}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
          {job.chargeType === "FREE"
            ? "오늘의 무료 횟수는 다시 채워드렸어요."
            : "사용한 프롬비는 돌려드렸어요."}{" "}
          잠시 후 다시 시도해 보세요. 사진을 바꿔서 해보면 잘 되는 경우도 많아요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {job.templateSlug && (
          <Link
            href={`/t/${job.templateSlug}/create`}
            className="bg-brand rounded-full px-5 py-2.5 text-[14px] font-semibold text-accent-ink"
          >
            다시 해보기
          </Link>
        )}
        <Link
          href="/help"
          className="rounded-full border border-line px-5 py-2.5 text-[14px] font-medium text-ink"
        >
          도움말
        </Link>
      </div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-sm px-4 py-24 text-center text-[13px] text-ink-soft">{children}</div>;
}
