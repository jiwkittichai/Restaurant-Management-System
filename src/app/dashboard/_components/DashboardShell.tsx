"use client";

import { useEffect, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

type HeaderUser = {
  displayName: string;
  username: string;
  roles: string[];
};

export default function DashboardShell({
  children,
  restaurantName,
  user,
}: {
  children: React.ReactNode;
  restaurantName?: string;
  user: HeaderUser;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const mobileViewport = window.matchMedia("(max-width: 767px)");

    if (mobileViewport.matches) {
      setIsSidebarOpen(false);
    }

    function handleViewportChange(event: MediaQueryListEvent) {
      setIsSidebarOpen(!event.matches);
    }

    mobileViewport.addEventListener("change", handleViewportChange);
    return () => mobileViewport.removeEventListener("change", handleViewportChange);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar
        roles={user.roles}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onToggle={() => setIsSidebarOpen((open) => !open)}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <Header
          user={user}
          restaurantName={restaurantName}
          onOpenNavigation={() => setIsSidebarOpen(true)}
        />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
