import { AdminHeader } from "@/components/admin-header";
import { AdminDashboardClient } from "@/components/admin-dashboard-client";

export default function AdminDashboardPage() {
  return (
    <>
      <AdminHeader title="Tổng quan" />
      <main className="flex-1 space-y-6 overflow-auto bg-[#f1f5f9] p-5 sm:p-6 dark:bg-slate-950">
        <AdminDashboardClient />
      </main>
    </>
  );
}
