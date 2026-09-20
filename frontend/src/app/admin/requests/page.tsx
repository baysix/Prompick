import { AdminRequestList } from "@/views/admin/AdminRequestList";
import { AdminTopBar } from "@/widgets/admin-shell/AdminTopBar";

export default function Page() {
  return (
    <>
      <AdminTopBar title="요청" />
      <main className="px-5 py-5">
        <AdminRequestList />
      </main>
    </>
  );
}
