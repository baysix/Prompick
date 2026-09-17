import { TemplateEditor } from "@/views/admin/TemplateEditor";
import { AdminTopBar } from "@/widgets/admin-shell/AdminTopBar";

export default function Page() {
  return (
    <>
      <AdminTopBar title="새 템플릿" />
      <main className="px-5 py-5">
        <TemplateEditor templateId={null} />
      </main>
    </>
  );
}
