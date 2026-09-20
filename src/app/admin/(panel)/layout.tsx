import { requireAdmin } from "@/server/auth/guards";
import { AdminShell } from "@/components/admin/AdminShell";
import { logoutAction } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <AdminShell adminName={admin.name} logout={logoutAction}>
      {children}
    </AdminShell>
  );
}
