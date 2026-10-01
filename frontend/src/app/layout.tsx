import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ADSENSE_CLIENT, env, SERVICE } from "@/shared/config/env";

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
  // 애드센스가 소유권을 확인할 때 읽는다. 스크립트와 함께 두는 이유는, 구글이 심사할 때
  // 자바스크립트를 돌리지 않고 HTML 만 읽는 경우가 있어서다. 둘 중 하나만 보여도 통과한다.
  ...(ADSENSE_CLIENT ? { other: { "google-adsense-account": ADSENSE_CLIENT } } : {}),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
          애드센스 스크립트.

          next/script 의 afterInteractive 를 쓰지 않는다. 그쪽은 화면이 뜬 뒤에 자바스크립트로
          끼워 넣는 방식이라, 처음 내려가는 HTML 에는 이 태그가 없다. 구글이 소유권을 확인할
          때 HTML 만 읽으면 못 찾는다.

          React 19 는 async 스크립트를 알아서 head 로 올려주고, 그 결과가 서버에서 그려진
          HTML 에 그대로 들어간다. 그래서 평범한 script 태그로 둔다.
        */}
        {ADSENSE_CLIENT && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
