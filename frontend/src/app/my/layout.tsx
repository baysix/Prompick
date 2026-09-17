import type { Metadata } from "next";
import { MyShell } from "@/views/my/MyShell";
import { SiteFooter } from "@/widgets/site-footer/SiteFooter";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";

export const metadata: Metadata = {
  title: "내 정보",
  robots: { index: false },
};

export default function MyLayout({ children }: LayoutProps<"/my">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <MyShell>{children}</MyShell>
      </main>
      <SiteFooter />
    </>
  );
}
