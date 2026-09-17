import type { Metadata } from "next";
import { AdminGate } from "@/views/admin/AdminGate";
import { AdminSidebar } from "@/widgets/admin-shell/AdminSidebar";

export const metadata: Metadata = {
  title: "관리자",
  // 관리자 화면은 검색에 노출되면 안 된다.
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <AdminGate>{children}</AdminGate>
      </div>
    </div>
  );
}
