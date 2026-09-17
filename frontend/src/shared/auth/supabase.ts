"use client";

import { createClient } from "@supabase/supabase-js";

/**
 * 브라우저용 Supabase 클라이언트.
 *
 * <b>여기서 하는 일은 로그인뿐이다.</b> DB 조회(supabase.from(...))는 절대 하지 않는다.
 * 템플릿·프롬프트 데이터는 반드시 우리 백엔드 API를 통해 받는다. 프론트에서 DB를 직접 읽으면
 * 파이프라인이 노출될 수 있다.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";

export const supabase = createClient(url, publishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const isAuthConfigured = Boolean(url && publishableKey);
