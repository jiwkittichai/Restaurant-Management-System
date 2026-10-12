import TablesPageClient from "./_components/TablesPageClient";
import { getCurrentUser } from "@/lib/auth";

export default async function TablesPage() {
  const user = await getCurrentUser();
  return <TablesPageClient canManageTables={Boolean(user?.roles.includes("OWNER"))} />;
}
