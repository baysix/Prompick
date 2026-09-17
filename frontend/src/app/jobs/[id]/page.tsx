import type { Metadata } from "next";
import { JobView } from "@/views/job/JobView";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";

export const metadata: Metadata = {
  title: "제작 중",
  robots: { index: false },
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <JobView jobId={Number(id)} />
      </main>
    </>
  );
}
