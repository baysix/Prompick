"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import Link from "next/link";
import { generationApi, generationKeys } from "@/entities/generation/api/generationApi";
import { isFinished, type Job } from "@/entities/generation/model/types";
import { useSession } from "@/shared/auth/SessionProvider";
import { cn } from "@/shared/lib/cn";
import { Button, ButtonLink } from "@/shared/ui/Button";

/**
 * 제작 진행과 결과.
 *
 * 끝날 때까지 상태를 물어보고 끝나면 멈춘다. 완료된 작업을 계속 물어보는 것은 사용자의
 * 데이터와 서버 자원을 함께 낭비한다.
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
        <p className="text-[16px] font-semibold text-ink">로그인이 필요해요</p>
        <ButtonLink href={`/login?next=${encodeURIComponent(`/jobs/${jobId}`)}`} className="mt-5">
          로그인
        </ButtonLink>
      </Center>
    );
  }

  if (isError) return <Center>작업을 찾을 수 없어요</Center>;
  if (!job) return <Center>불러오는 중</Center>;

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/my/jobs" className="text-[13px] text-ink-soft hover:text-ink">
          ← 내 작업함
        </Link>

        <h1 className="mt-4 text-[24px] font-bold tracking-[-0.04em] text-ink">
          {job.templateTitle}
        </h1>

        {job.status === "SUCCEEDED" ? (
          <Succeeded job={job} />
        ) : job.status === "FAILED" ? (
          <Failed job={job} />
        ) : (
          <Running job={job} />
        )}
      </div>
    </main>
  );
}

/**
 * 진행률.
 *
 * AI 는 "몇 퍼센트 했는지"를 알려주지 않는다. 그러니 우리가 아는 것으로만 만들어야 한다 —
 * 시작한 시각과, 이 템플릿이 보통 걸리는 시간.
 *
 * 곡선을 쓰는 이유가 있다. 남은 시간을 그대로 비율로 그리면 예상 시간을 넘기는 순간 100%에
 * 닿아 버리고, 그다음부터는 다 됐다고 해놓고 안 끝나는 막대가 된다. 그건 멈춘 막대보다 나쁘다.
 * 이 식은 예상 시간에서 86%쯤에 이르고 그 뒤로는 점점 느리게 오르며 100%에 닿지 않는다.
 * 끝났다고 말하는 것은 오직 서버가 끝났다고 할 때뿐이다.
 */
function progressOf(elapsedSeconds: number, estimatedSeconds: number): number {
  const estimate = estimatedSeconds > 0 ? estimatedSeconds : 120;
  const curve = 1 - Math.exp((-2 * elapsedSeconds) / estimate);
  return Math.min(Math.round(curve * 100), 97);
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes}분` : `${minutes}분 ${rest}초`;
}

function Running({ job }: { job: Job }) {
  // 1초마다 다시 그린다. 서버는 3초마다 물어보지만, 그사이에도 시간은 흐른다.
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 아직 차례를 기다리는 중이면 시작 시각이 없다. 큐에서 기다린 시간을 제작 시간에
  // 섞으면 "3분 걸린다더니 왜 5분째냐"가 된다.
  const startedAt = job.startedAt ? Date.parse(job.startedAt) : null;
  const waiting = startedAt === null;

  const elapsed = waiting ? 0 : Math.max(0, Math.floor((now - startedAt) / 1000));
  const percent = waiting ? 0 : progressOf(elapsed, job.estimatedSeconds);
  const overdue = !waiting && elapsed > job.estimatedSeconds;

  return (
    <div className="mt-6">
      <div className="rounded-xl border border-line p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <p className="text-[15px] font-medium text-ink">{job.statusMessage}</p>
          {!waiting && (
            <p className="font-mono text-[13px] text-ink-soft tabular-nums">{percent}%</p>
          )}
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className={cn(
              "h-full rounded-full bg-accent",
              // 기다리는 동안에는 길이가 아니라 숨결로 살아 있음을 보인다.
              waiting ? "w-1/4 animate-pulse" : "transition-[width] duration-1000 ease-out",
            )}
            style={waiting ? undefined : { width: `${Math.max(percent, 4)}%` }}
          />
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
          {job.totalSteps > 1 && `${job.currentStep + 1}번째 단계 / 전체 ${job.totalSteps}단계 · `}
          {waiting
            ? "곧 시작돼요"
            : overdue
              ? `${formatDuration(elapsed)} 지났어요 · 예상보다 조금 더 걸리고 있어요`
              : `${formatDuration(elapsed)} 지났어요 · 보통 ${formatDuration(job.estimatedSeconds)}쯤 걸려요`}
        </p>

        <p className="mt-1 text-[12px] text-ink-faint">이 화면을 닫아도 계속 만들어져요</p>
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
        <figure className="overflow-hidden rounded-xl bg-surface">
          {output.mediaType === "VIDEO" && /\.(mp4|webm)(\?|$)/i.test(output.url) ? (
            <video src={output.url} controls autoPlay loop muted playsInline className="w-full" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={output.url} alt="" className="w-full" />
          )}
        </figure>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {output && <DownloadButton jobId={job.id} />}
        {job.templateSlug && (
          <ButtonLink href={`/t/${job.templateSlug}/create`} variant="secondary" size="lg">
            다시 만들기
          </ButtonLink>
        )}
        <ButtonLink href="/explore" variant="ghost" size="lg">
          다른 것도 보기
        </ButtonLink>
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
      <div className="rounded-xl border border-line p-6">
        <p className="text-[15px] font-medium text-ink">
          {timedOut ? "시간이 너무 오래 걸려 멈췄어요" : "만들지 못했어요"}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-soft">
          {job.chargeType === "FREE"
            ? "오늘의 무료 횟수는 다시 채워드렸어요."
            : "사용한 프롬비는 돌려드렸어요."}{" "}
          사진을 바꿔서 해보면 잘 되는 경우도 많아요.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {job.templateSlug && (
          <ButtonLink href={`/t/${job.templateSlug}/create`} size="lg">
            다시 해보기
          </ButtonLink>
        )}
        <ButtonLink href="/help" variant="secondary" size="lg">
          도움말
        </ButtonLink>
      </div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-sm px-4 py-28 text-center text-[13px] text-ink-soft">
      {children}
    </div>
  );
}

/**
 * 내려받기.
 *
 * 누르는 순간 주소를 새로 받아온다. 결과물 주소는 5분이면 만료되는데, 결과 화면을 열어두고
 * 한참 뒤에 누르는 일이 흔하다. 화면을 그릴 때 받아둔 주소를 그대로 쓰면 그때 죽어 있다.
 *
 * 또 하나: {@code <a download>} 는 다른 도메인 주소에 듣지 않는다. 브라우저가 일부러 무시해서
 * 저장 대신 새 탭에 띄워버린다. 그래서 서버가 "이건 파일이다"라고 표시해 준 주소를 따로 받는다.
 */
function DownloadButton({ jobId }: { jobId: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function download() {
    setBusy(true);
    setError(false);
    try {
      const fresh = await generationApi.job(jobId);
      const target = fresh.outputs[0]?.downloadUrl;
      if (!target) throw new Error("주소가 없어요");
      window.location.href = target;
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button size="lg" onClick={download} disabled={busy}>
        {busy ? "준비 중" : "내려받기"}
      </Button>
      {error && (
        <p className="mt-2 text-[13px] text-[#ff9b9b]">
          받지 못했어요. 잠시 후 다시 눌러주세요.
        </p>
      )}
    </div>
  );
}
