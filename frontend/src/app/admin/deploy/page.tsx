import { DeployPanel } from "@/views/admin/DeployPanel";
import { AdminTopBar } from "@/widgets/admin-shell/AdminTopBar";

export default function Page() {
  return (
    <>
      <AdminTopBar title="배포 준비" />
      <main className="px-5 py-5">
        <DeployPanel />
      </main>
    </>
  );
}
