"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/shared/api/client";
import { SessionProvider } from "@/shared/auth/SessionProvider";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 받아온 값을 곧바로 낡은 것으로 본다. 화면에 다시 들어올 때마다 새로 받아온다.
            // 캐시된 값을 먼저 그리고 뒤에서 갱신하므로 화면이 비지는 않는다.
            staleTime: 0,
            refetchOnMount: "always",
            refetchOnWindowFocus: true,
            retry: (failureCount, error) => {
              // 권한·검증 오류는 다시 시도해도 결과가 같다.
              if (error instanceof ApiError && error.status < 500) return false;
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
}
