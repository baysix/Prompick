import { AiModelList } from "@/views/admin/AiModelList";
import { AdminTopBar } from "@/widgets/admin-shell/AdminTopBar";

export default function Page() {
  return (
    <>
      <AdminTopBar title="AI 모델" />
      <main className="px-5 py-5">
        <AiModelList />
      </main>
    </>
  );
}
