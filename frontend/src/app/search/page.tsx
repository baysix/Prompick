import { Suspense } from "react";
import type { Metadata } from "next";
import { SearchView } from "@/views/search/SearchView";
import { SiteFooter } from "@/widgets/site-footer/SiteFooter";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";

export const metadata: Metadata = {
  title: "검색",
};

export default function SearchPage() {
  return (
    <>
      <SiteHeader />
      <Suspense fallback={<div className="flex-1" />}>
        <SearchView />
      </Suspense>
      <SiteFooter />
    </>
  );
}
