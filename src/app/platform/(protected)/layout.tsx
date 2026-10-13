import { redirect } from "next/navigation";
import { getPlatformAdmin } from "@/lib/platform";
import PlatformShell from "./_components/PlatformShell";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const admin = await getPlatformAdmin();
  if (!admin) redirect("/login");
  return <PlatformShell>{children}</PlatformShell>;
}
