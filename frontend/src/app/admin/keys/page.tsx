import { ProviderKeyList } from "@/views/admin/ProviderKeyList";
import { AdminTopBar } from "@/widgets/admin-shell/AdminTopBar";

export default function Page() {
  return (
    <>
      <AdminTopBar title="제공사 키" />
      <main className="px-5 py-5">
        <ProviderKeyList />
      </main>
    </>
  );
}
