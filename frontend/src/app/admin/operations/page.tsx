import { OperationsView } from "@/views/admin/OperationsView";
import { AdminTopBar } from "@/widgets/admin-shell/AdminTopBar";

export default function Page() {
  return (
    <>
      <AdminTopBar title="매출·원가" />
      <main className="px-5 py-5">
        <OperationsView />
      </main>
    </>
  );
}
