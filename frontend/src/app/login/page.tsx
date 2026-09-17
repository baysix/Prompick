import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginView } from "@/views/auth/LoginView";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";

export const metadata: Metadata = {
  title: "로그인",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<div className="flex-1" />}>
        <LoginView />
      </Suspense>
    </>
  );
}
