import { redirect } from "next/navigation";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import RoleBoundary from "../components/RoleBoundary";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar roles={user.roles} />
      <div className="flex flex-col flex-1 overflow-auto">
        <Header user={user} />
        <main className="flex-1 w-full"><RoleBoundary roles={user.roles}>{children}</RoleBoundary></main>
      </div>
    </div>
  );
}
