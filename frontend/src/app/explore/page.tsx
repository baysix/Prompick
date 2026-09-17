import { Suspense } from "react";
import type { Metadata } from "next";
import { ExploreView } from "@/views/explore/ExploreView";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";

export const metadata: Metadata = {
  title: "탐색",
  description: "유행하는 AI 영상·이미지 템플릿을 종류와 요금으로 골라 보세요.",
};

export default function ExplorePage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<div className="flex-1" />}>
        <ExploreView />
      </Suspense>
    </>
  );
}
