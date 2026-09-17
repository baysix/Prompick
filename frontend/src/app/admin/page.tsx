import { AdminDashboard } from "@/views/admin/AdminDashboard";
import { AdminTopBar } from "@/widgets/admin-shell/AdminTopBar";

export default function Page() {
  return (
    <>
      <AdminTopBar title="대시보드" />
      <main className="px-5 py-5">
        <AdminDashboard />
      </main>
    </>
  );
}
