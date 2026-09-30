"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import type { DeployStatus } from "@/entities/admin/model/types";
import { Button } from "@/shared/ui/Button";
import { Badge, Card, Field, Input } from "@/widgets/admin-shell/Card";

/**
 * 배포 준비.
 *
 * 배포는 서버를 껐다 켜는 일이라, 그때 돌고 있던 제작은 끊긴다. 끊긴 작업은 10분 뒤 다시
 * 집혀 처음 단계부터 다시 돌아간다 — 이미 낸 AI 요금을 한 번 더 내는 셈이다.
 *
 * 그래서 이 화면은 "지금 배포해도 되는지" 하나만 말해준다. 숫자를 여러 개 늘어놓고 알아서
 * 판단하라고 하면, 급할 때 잘못 읽는다.
 *
 * 공지를 따로 쓰게 하지 않는다. 잠그면 모든 화면 위에 안내 띠가 저절로 뜨고, 풀면 사라진다.
 * 잠금과 안내가 따로면 급할 때 안내를 빼먹는데, 배포 직전은 언제나 급하다.
 */
const DEFAULT_MESSAGE = "잠시 점검 중이라 제작을 받지 않아요. 곧 다시 열려요.";

export function DeployPanel() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const { data, isPending } = useQuery({
    queryKey: adminKeys.deployStatus(),
    queryFn: () => adminApi.deployStatus(),
    // 잠근 뒤에는 남은 작업이 0이 되기를 기다리는 화면이 된다. 직접 새로고침하게 두면
    // 사람이 그 앞에 붙어 있어야 한다.
    refetchInterval: 5_000,
  });

  const apply = (next: DeployStatus) => {
    queryClient.setQueryData(adminKeys.deployStatus(), next);
  };

  const lock = useMutation({
    mutationFn: () => adminApi.lockGeneration(message),
    onSuccess: apply,
  });

  const unlock = useMutation({
    mutationFn: () => adminApi.unlockGeneration(),
    onSuccess: apply,
  });

  if (isPending || !data) {
    return <p className="text-[13px] text-ink-faint">불러오는 중</p>;
  }

  const remaining = data.queuedJobs + data.runningJobs;

  return (
    <div className="space-y-5">
      <Verdict status={data} />

      <Card
        title="배포 절차"
        description="순서대로 하면 잃어버리는 작업도, 두 번 나가는 요금도 없어요."
      >
        <ol className="space-y-3 text-[13px] leading-relaxed text-ink-soft">
          <Step n={1} done={data.locked}>
            <strong className="text-ink">제작을 잠가요.</strong> 이 순간부터 새 요청만 막혀요.
            이미 돌고 있는 작업은 끝까지 가요. 안내 띠는 모든 화면에 저절로 떠요 — 공지를 따로
            쓸 필요 없어요.
          </Step>
          <Step n={2} done={data.locked && remaining === 0}>
            <strong className="text-ink">남은 작업이 0이 되기를 기다려요.</strong> 늦어도 20분이면
            비어요. 이 화면이 5초마다 알아서 확인해요.
          </Step>
          <Step n={3} done={false}>
            <strong className="text-ink">배포하고, 올라온 걸 확인한 뒤 잠금을 풀어요.</strong>
            띠도 같이 사라져요.
          </Step>
        </ol>
      </Card>

      <Card
        title={data.locked ? "지금 잠겨 있어요" : "제작 잠그기"}
        description={
          data.locked
            ? "배포가 끝나면 반드시 다시 열어주세요. 잠긴 동안에는 아무도 만들 수 없어요."
            : "누르면 바로 잠기고, 모든 화면에 안내 띠가 떠요."
        }
      >
        {data.locked ? (
          <div className="space-y-4">
            <p className="rounded-lg border border-line bg-ground px-3.5 py-3 text-[13px] leading-relaxed text-ink">
              {data.message}
            </p>
            {data.lockedAt && (
              <p className="text-[12px] text-ink-faint">
                {new Date(data.lockedAt).toLocaleString("ko-KR")}부터 잠겨 있어요
              </p>
            )}
            <Button onClick={() => unlock.mutate()} disabled={unlock.isPending}>
              {unlock.isPending ? "여는 중" : "제작 다시 열기"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Button
              variant="secondary"
              onClick={() => lock.mutate()}
              disabled={lock.isPending}
            >
              {lock.isPending ? "잠그는 중" : "제작 잠그기"}
            </Button>

            {/*
              문구는 접어둔다. 배포 때마다 같은 말을 쓰게 되므로 기본값이 있으면 충분하고,
              급할 때 빈칸을 마주하면 그 자리에서 문장을 지어내야 한다. 특별히 할 말이 있을
              때만 펴서 고친다.
            */}
            <details className="group">
              <summary className="cursor-pointer list-none text-[12px] text-ink-faint hover:text-ink-soft">
                안내 문구 고치기 <span className="group-open:hidden">▾</span>
                <span className="hidden group-open:inline">▴</span>
              </summary>
              <div className="mt-3">
                <Field
                  label="안내 문구"
                  hint="언제 다시 열리는지 적어주세요. '점검 중'이라고만 하면 대부분 그냥 떠나요."
                >
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={200}
                    placeholder={DEFAULT_MESSAGE}
                  />
                </Field>
              </div>
            </details>
          </div>
        )}
      </Card>
    </div>
  );
}

/**
 * 배포해도 되는지 한 줄로.
 *
 * 세 가지가 모두 맞을 때만 된다고 말한다 — 잠겨 있고, 대기 중인 작업이 없고, 돌고 있는
 * 작업도 없을 때. 잠그지 않은 채 대기열만 빈 것은 다음 순간 다시 찰 수 있다.
 */
function Verdict({ status }: { status: DeployStatus }) {
  const remaining = status.queuedJobs + status.runningJobs;

  const tone = status.safeToDeploy
    ? "border-accent/40 bg-accent/8"
    : "border-line bg-surface";

  return (
    <section className={`rounded-xl border px-5 py-5 ${tone}`}>
      <p className="text-[18px] font-bold tracking-[-0.03em] text-ink">
        {status.safeToDeploy
          ? "지금 배포해도 돼요"
          : status.locked
            ? `아직이에요 · 남은 작업 ${remaining}건`
            : "아직 잠그지 않았어요"}
      </p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
        {status.safeToDeploy
          ? "잠겨 있고 돌고 있는 작업도 없어요. 끊길 제작이 없습니다."
          : status.locked
            ? "돌고 있는 작업이 끝나기를 기다리는 중이에요. 지금 배포하면 이 작업들의 AI 요금이 두 번 나가요."
            : "잠그지 않으면 기다려도 소용없어요. 기다리는 사이에 새 제작이 계속 들어와요."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone={status.locked ? "warn" : "neutral"}>
          {status.locked ? "제작 잠김" : "제작 받는 중"}
        </Badge>
        <Badge tone={status.queuedJobs === 0 ? "good" : "neutral"}>
          대기 {status.queuedJobs}건
        </Badge>
        <Badge tone={status.runningJobs === 0 ? "good" : "warn"}>
          진행 {status.runningJobs}건
        </Badge>
      </div>
    </section>
  );
}

function Step({ n, done, children }: { n: number; done: boolean; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
          done ? "bg-accent text-accent-ink" : "bg-white/8 text-ink-soft"
        }`}
      >
        {done ? "✓" : n}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}
