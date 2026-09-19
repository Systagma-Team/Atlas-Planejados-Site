import { requireAdmin } from "@/server/auth/guards";
import { countUnreadLeads } from "@/server/services/leads";
import { AdminShell } from "@/components/admin/AdminShell";
import { logoutAction } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const unread = await countUnreadLeads();

  return (
    <AdminShell adminName={admin.name} unreadMessages={unread} logout={logoutAction}>
      {children}
    </AdminShell>
  );
}
