import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { templateApi } from "@/entities/template/api/templateApi";
import { TemplateDetailView } from "@/views/template-detail/TemplateDetailView";
import { SiteFooter } from "@/widgets/site-footer/SiteFooter";
import { SiteHeader } from "@/widgets/site-header/SiteHeader";
import type { TemplateDetail } from "@/entities/template/model/types";

// 매 요청마다 서버에서 새로 그린다. 관리자가 템플릿을 고치면 바로 반영된다.
// 대신 Render 무료 인스턴스가 잠들어 있으면 첫 방문자가 깨어날 때까지 기다린다.
export const dynamic = "force-dynamic";

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
      <SiteFooter />
    </>
  );
}
