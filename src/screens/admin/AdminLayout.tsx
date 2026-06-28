import { Outlet } from "react-router-dom";

import AdminHeader from "@/components/admin/AdminHeader";
import TabBar from "@/components/admin/TabBar";

export default function AdminLayout() {
  return (
    <div className="flex h-[100dvh] min-h-[100dvh] flex-col overflow-hidden bg-paper">
      <AdminHeader />
      <main className="min-h-0 flex-1 overflow-y-auto pb-[calc(70px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <TabBar />
    </div>
  );
}
