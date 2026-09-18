import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { templateApi } from "@/entities/template/api/templateApi";
import { CreateForm } from "@/views/create/CreateForm";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";

export const metadata: Metadata = {
  title: "만들기",
  robots: { index: false },
};

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let template;
  try {
    template = await templateApi.detail(slug);
  } catch {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <CreateForm template={template} />
      </main>
    </>
  );
}
