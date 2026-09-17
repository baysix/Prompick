"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, setTokenProvider } from "@/shared/api/client";
import { supabase } from "./supabase";

export interface Me {
  nickname: string;
  email: string | null;
  role: "USER" | "ADMIN";
  identityVerified: boolean;
  phoneVerifiedAt: string | null;
  creditBalance: number;
  freeDailyLimit: number;
  creditUnitName: string;
}

interface SessionValue {
  /** 로그인 여부를 아직 확인 중인지 */
  loading: boolean;
  signedIn: boolean;
  me: Me | null;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue>({
  loading: true,
  signedIn: false,
  me: null,
  signOut: async () => {},
});

export function useSession() {
  return useContext(SessionContext);
}

// API 호출에 붙일 토큰을 Supabase 세션에서 가져온다.
// 만료가 임박하면 supabase-js가 알아서 갱신해 준다.
setTokenProvider(async () => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (alive) setSignedIn(Boolean(data.session));
    });

    // 로그인·로그아웃·토큰 갱신을 모두 여기서 받는다. 다른 탭에서 로그아웃해도 반영된다.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
      void queryClient.invalidateQueries({ queryKey: ["me"] });
    });

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, [queryClient]);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => api.get<Me>("/me"),
    enabled: signedIn === true,
    staleTime: 30_000,
  });

  async function signOut() {
    await supabase.auth.signOut();
    queryClient.clear();
  }

  return (
    <SessionContext.Provider
      value={{
        loading: signedIn === null,
        signedIn: signedIn === true,
        me: me ?? null,
        signOut,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
