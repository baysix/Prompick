import { TemplateEditor } from "@/views/admin/TemplateEditor";
import { AdminTopBar } from "@/widgets/admin-shell/AdminTopBar";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <>
      <AdminTopBar title="템플릿 편집" />
      <main className="px-5 py-5">
        <TemplateEditor templateId={Number(id)} />
      </main>
    </>
  );
}
