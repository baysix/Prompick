import { TemplateEditor } from "@/views/admin/TemplateEditor";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TemplateEditor templateId={Number(id)} />;
}
