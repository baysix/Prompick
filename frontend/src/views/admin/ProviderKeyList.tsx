"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { adminApi, adminKeys } from "@/entities/admin/api/adminApi";
import type { ProviderKey } from "@/entities/admin/model/types";
import { ApiError } from "@/shared/api/client";
import { Button } from "@/shared/ui/Button";
import { Badge, Card, Input } from "@/widgets/admin-shell/Card";

/**
 * 제공사 키.
 *
 * 여기서 키를 넣으면 서버를 다시 띄우지 않아도 바로 적용된다. 키가 만료되거나 한도가 차는 일은
 * 새벽에도 일어나는데, 그때마다 배포할 수는 없다.
 *
 * 한 번 넣은 키는 다시 볼 수 없다. 끝 네 자리만 남는다. 꺼낼 수 있게 만들면 그 경로 하나 때문에
 * 화면·로그·브라우저 기록 어디에든 키가 남는다. 잊어버렸으면 제공사에서 새로 발급받아 덮어쓴다.
 */
export function ProviderKeyList() {
  const { data, isPending } = useQuery({
    queryKey: adminKeys.providerKeys(),
    queryFn: adminApi.providerKeys,
  });

  if (isPending) return <p className="text-[13px] text-ink-faint">불러오는 중</p>;

  const items = data?.items ?? [];

  return (
    <div className="max-w-3xl space-y-4">
      {!data?.canStore && (
        <div className="rounded-xl border border-paid/40 bg-paid/10 px-4 py-3">
          <p className="text-[13px] font-medium text-paid">마스터 키가 없어 키를 저장할 수 없어요</p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink-soft">
            제공사 키는 암호화해서 넣어요. 그 암호를 푸는 열쇠는 DB가 아니라 서버 환경변수에
            둡니다 — 둘을 같이 두면 암호화한 의미가 없어요. 서버의{" "}
            <code className="font-mono text-ink">PROMPICK_MASTER_KEY</code>를 채우고 다시
            띄워주세요.
          </p>
        </div>
      )}

      <p className="text-[13px] leading-relaxed text-ink-soft">
        파이프라인이 외부 AI를 부를 때 쓰는 키예요. 여기 넣은 값이 설정 파일보다 우선하고, 저장하면
        서버를 다시 띄우지 않아도 바로 적용돼요.
      </p>

      {items.map((item) => (
        <KeyRow key={item.provider} item={item} canStore={data?.canStore ?? false} />
      ))}
    </div>
  );
}

function KeyRow({ item, canStore }: { item: ProviderKey; canStore: boolean }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<string | null>(null);
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => {
    setDraft(null);
    setMemo("");
    setError(null);
    void queryClient.invalidateQueries({ queryKey: adminKeys.providerKeys() });
  };

  const save = useMutation({
    mutationFn: () =>
      adminApi.saveProviderKey(item.provider, {
        apiKey: (draft ?? "").trim(),
        memo: memo.trim() || null,
      }),
    onSuccess: invalidate,
    onError: (e) =>
      setError(e instanceof ApiError ? e.message : "저장하지 못했어요. 키 형식을 확인해주세요."),
  });

  const toggle = useMutation({
    mutationFn: () => adminApi.setProviderKeyActive(item.provider, !item.active),
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: () => adminApi.deleteProviderKey(item.provider),
    onSettled: invalidate,
  });

  const editing = draft !== null;

  return (
    <Card>
      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[15px] font-semibold text-ink">
            {item.displayName}
            <Status item={item} />
          </p>

          <p className="mt-1 text-[12px] text-ink-faint">
            {item.stored ? (
              <>
                키 {item.keyHint}
                {item.updatedAt && (
                  <>
                    {" · "}
                    {new Date(item.updatedAt).toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric",
                    })}{" "}
                    갱신
                  </>
                )}
                {item.updatedBy && ` · ${item.updatedBy}`}
              </>
            ) : item.fromEnv ? (
              "설정 파일에 들어 있어요. 여기서 넣으면 그 값을 대신해요"
            ) : (
              "아직 키가 없어요"
            )}
          </p>

          {item.memo && <p className="mt-1.5 text-[12px] text-ink-soft">{item.memo}</p>}
        </div>

        {!editing && (
          <div className="flex shrink-0 gap-2">
            <Button
              size="sm"
              variant={item.stored ? "secondary" : "primary"}
              disabled={!canStore}
              title={canStore ? undefined : "마스터 키가 없어 저장할 수 없어요"}
              onClick={() => setDraft("")}
            >
              {item.stored ? "바꾸기" : "키 넣기"}
            </Button>

            {item.stored && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={toggle.isPending}
                  onClick={() => toggle.mutate()}
                >
                  {item.active ? "중지" : "사용"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={remove.isPending}
                  onClick={() => remove.mutate()}
                >
                  삭제
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {editing && (
        <div className="mt-4 space-y-3 border-t border-line pt-4">
          <Input
            type="password"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="키를 붙여넣으세요"
            className="font-mono"
            aria-label={`${item.displayName} API 키`}
          />

          <Input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모 (선택) — 어느 계정의 키인지 적어두면 나중에 찾기 쉬워요"
          />

          <p className="text-[12px] leading-relaxed text-ink-faint">
            저장하면 암호화해서 넣어요. 저장한 뒤에는 끝 네 자리만 볼 수 있고 원문은 다시 꺼낼 수
            없어요.
          </p>

          {error && <p className="text-[13px] text-paid">{error}</p>}

          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={save.isPending || draft.trim().length < 8}
              onClick={() => save.mutate()}
            >
              {save.isPending ? "저장 중" : "저장"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>
              취소
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

function Status({ item }: { item: ProviderKey }) {
  if (item.stored && !item.active) return <Badge tone="warn">중지됨</Badge>;
  if (item.stored) return <Badge tone="good">사용 중</Badge>;
  if (item.fromEnv) return <Badge>설정 파일</Badge>;
  return <Badge tone="warn">없음</Badge>;
}
