import { AdminUserList } from "@/views/admin/AdminUserList";
import { AdminTopBar } from "@/widgets/admin-shell/AdminTopBar";

export default function Page() {
  return (
    <>
      <AdminTopBar title="사용자" />
      <main className="px-5 py-5">
        <AdminUserList />
      </main>
    </>
  );
}
