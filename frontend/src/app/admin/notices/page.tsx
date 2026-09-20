import { AdminNoticeList } from "@/views/admin/AdminNoticeList";
import { AdminTopBar } from "@/widgets/admin-shell/AdminTopBar";

export default function Page() {
  return (
    <>
      <AdminTopBar title="공지사항" />
      <main className="px-5 py-5">
        <AdminNoticeList />
      </main>
    </>
  );
}
