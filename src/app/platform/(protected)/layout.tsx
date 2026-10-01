import { redirect } from "next/navigation";
import { getPlatformAdmin, platformSettings } from "@/lib/platform";
import PlatformShell from "./_components/PlatformShell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const admin = await getPlatformAdmin();
  if (!admin) redirect("/login");
  const settings = await platformSettings();
  const logoUrl = settings.logoUrl ? `/api/platform/logo?v=${settings.updatedAt.getTime()}` : null;
  return <PlatformShell adminName={admin.displayName} platformName={settings.name} logoUrl={logoUrl}>{children}</PlatformShell>;
}
