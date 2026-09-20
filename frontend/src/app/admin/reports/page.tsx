import { AdminBugReportList } from "@/views/admin/AdminBugReportList";
import { AdminTopBar } from "@/widgets/admin-shell/AdminTopBar";

export default function Page() {
  return (
    <>
      <AdminTopBar title="오류 신고" />
      <main className="px-5 py-5">
        <AdminBugReportList />
      </main>
    </>
  );
}
