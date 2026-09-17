import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { templateApi } from "@/entities/template/api/templateApi";
import { TemplateDetailView } from "@/views/template-detail/TemplateDetailView";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";
import type { TemplateDetail } from "@/entities/template/model/types";

export const revalidate = 60;

async function load(slug: string): Promise<TemplateDetail | null> {
  try {
    return await templateApi.detail(slug);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const template = await load(slug);
  if (!template) {
    return { title: "찾을 수 없는 템플릿" };
  }

  const description =
    template.description ??
    `${template.requiredPhotoSummary ?? "사진"}만 올리면 만들 수 있는 AI ${
      template.contentType === "VIDEO" ? "영상" : "이미지"
    } 템플릿이에요.`;

  const image = template.media[0]?.thumbnailUrl ?? undefined;

  return {
    title: template.title,
    description,
    openGraph: {
      title: template.title,
      description,
      images: image ? [image] : undefined,
      type: "article",
    },
  };
}

export default async function TemplatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = await load(slug);
  if (!template) notFound();

  return (
    <>
      <SiteHeader />
      <TemplateDetailView template={template} />
    </>
  );
}
