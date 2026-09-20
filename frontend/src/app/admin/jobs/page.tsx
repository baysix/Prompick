import { AdminJobList } from "@/views/admin/AdminJobList";
import { AdminTopBar } from "@/widgets/admin-shell/AdminTopBar";

export default function Page() {
  return (
    <>
      <AdminTopBar title="제작 내역" />
      <main className="px-5 py-5">
        <AdminJobList />
      </main>
    </>
  );
}
