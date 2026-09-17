import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { env, SERVICE } from "@/shared/config/env";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: `${SERVICE.name} — 유행하는 AI 영상·이미지, 프롬프트까지`,
    template: `%s | ${SERVICE.name}`,
  },
  description:
    "인스타·쇼츠에서 유행하는 AI 영상과 이미지의 프롬프트를 모았어요. 프롬프트를 그대로 받아 가거나, 사진 한 장만 올리면 대신 만들어 드려요.",
  openGraph: {
    type: "website",
    siteName: SERVICE.name,
    locale: "ko_KR",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
