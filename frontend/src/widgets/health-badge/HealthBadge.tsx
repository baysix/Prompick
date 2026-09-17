"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/shared/api/client";

interface HealthResponse {
  status: string;
  service: string;
  time: string;
}

/** 0단계 완료 조건 확인용. 프론트에서 백엔드까지 실제로 통하는지 보여준다. */
export function HealthBadge() {
  const { data, isPending, isError } = useQuery({
    queryKey: ["health"],
    queryFn: () => api.get<HealthResponse>("/health"),
    retry: false,
  });

  const state = isPending
    ? { dot: "bg-neutral-400", text: "백엔드 확인 중…" }
    : isError
      ? { dot: "bg-red-500", text: "백엔드에 연결할 수 없어요 (localhost:8080)" }
      : { dot: "bg-green-500", text: `백엔드 연결됨 · ${data?.service}` };

  return (
    <div className="flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800">
      <span className={`inline-block h-2 w-2 rounded-full ${state.dot}`} />
      <span>{state.text}</span>
    </div>
  );
}
