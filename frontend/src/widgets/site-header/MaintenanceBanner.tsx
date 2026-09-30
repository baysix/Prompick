"use client";

import { useQuery } from "@tanstack/react-query";
import { generationApi, generationKeys } from "@/entities/generation/api/generationApi";

/**
 * 점검 안내 띠.
 *
 * 제작을 잠그면 이 띠가 저절로 뜬다. 잠금과 안내를 따로 하지 않는 이유는, 따로 하면 급할 때
 * 안내를 빼먹기 때문이다. 배포 직전은 언제나 급하다. 공지를 따로 쓰지 않아도 잠그는 순간
 * 모든 화면에 뜨고, 푸는 순간 사라진다.
 *
 * 팝업이 아니라 띠로 둔다. 팝업은 닫고 나면 다시 안 보여서, 닫은 뒤 제작 화면까지 들어간
 * 사람은 버튼 앞에서 다시 영문을 모르게 된다. 띠는 점검이 끝날 때까지 계속 붙어 있는다.
 *
 * 상단바 안에 있으므로 상단바와 함께 따라다닌다. 스크롤을 내려도 보인다.
 */
export function MaintenanceBanner() {
  const { data } = useQuery({
    queryKey: generationKeys.serviceStatus(),
    queryFn: () => generationApi.serviceStatus(),
    // 잠그는 순간과 푸는 순간을 둘 다 빨리 따라가야 한다. 풀었는데 띠가 남아 있으면
    // 멀쩡한 서비스를 점검 중이라고 광고하는 꼴이 된다.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  if (!data?.generationLocked) {
    return null;
  }

  return (
    <div role="status" className="border-b border-paid/25 bg-paid/12">
      <p className="mx-auto flex max-w-[1280px] items-center gap-2 px-4 py-2.5 text-[13px] leading-snug text-paid">
        <span aria-hidden className="shrink-0">
          🔧
        </span>
        <span className="min-w-0">
          {data.message ?? "잠시 점검 중이라 제작을 받지 않아요."}
        </span>
      </p>
    </div>
  );
}
