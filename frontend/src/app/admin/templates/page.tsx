import { AdminTemplateList } from "@/views/admin/AdminTemplateList";
import { AdminTopBar } from "@/widgets/admin-shell/AdminTopBar";

export default function Page() {
  return (
    <>
      <AdminTopBar title="템플릿" />
      <main className="px-5 py-5">
        <AdminTemplateList />
      </main>
    </>
  );
}
