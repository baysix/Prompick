"use client";

import { useQuery } from "@tanstack/react-query";
import { generationApi, generationKeys } from "../api/generationApi";

/**
 * 지금 제작을 받는지.
 *
 * 만들기로 이어지는 자리가 여러 군데다 — 템플릿 상세, 제작 화면, 결과 화면의 "다시 만들기".
 * 한 곳만 막으면 나머지로 들어가 버튼 앞에서 거절당하므로, 조회를 여기 한 곳에 모아 세 곳이
 * 같은 값을 같은 주기로 본다.
 *
 * 30초마다 다시 본다. 사람들이 화면을 열어둔 채로 고르고 있는 동안 잠길 수 있고, 반대로
 * 풀렸는데 계속 잠겼다고 보여주면 멀쩡한 서비스를 닫아둔 꼴이 된다.
 *
 * 화면을 막는 것은 배려이지 방어가 아니다. 실제 거절은 서버가 제작 요청을 받을 때 다시 한다.
 */
export function useGenerationLock() {
  const { data } = useQuery({
    queryKey: generationKeys.serviceStatus(),
    queryFn: () => generationApi.serviceStatus(),
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  return {
    locked: data?.generationLocked === true,
    message: data?.message ?? "잠시 점검 중이라 제작을 받지 않아요.",
  };
}
