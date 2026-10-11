"use client";

import {
  BookOpenText,
  ChartNoAxesCombined,
  ChefHat,
  House,
  LayoutGrid,
  Menu,
  PackageOpen,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Tags,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ElementType } from "react";
import { dashboardSidebarItems, type DashboardIconName } from "../navigation";
import { hasAnyDashboardRole } from "../roles";

const icons: Record<DashboardIconName, ElementType> = {
  House,
  ShoppingCart,
  ShoppingBag,
  LayoutGrid,
  ChefHat,
  PackageOpen,
  BookOpenText,
  UtensilsCrossed,
  Tags,
  ChartNoAxesCombined,
  Users,
  Settings,
};

export default function Sidebar({ roles }: { roles: string[] }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const sidebarItems = dashboardSidebarItems.filter((item) =>
    hasAnyDashboardRole(roles, item.roles),
  );

  function isActive(path: string) {
    return (
      pathname === path ||
      (path !== "/dashboard" && pathname.startsWith(`${path}/`))
    );
  }

  return (
    <aside
      className={`flex h-screen flex-col bg-white transition-all duration-300 ease-in-out ${
        isSidebarOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="p-4">
        <button
          onClick={() => setIsSidebarOpen((open) => !open)}
          className="p-3"
          aria-label={isSidebarOpen ? "ย่อเมนู" : "ขยายเมนู"}
        >
          <Menu className="h-6 w-6 text-[#356DDB]" />
        </button>
      </div>

      <div className="flex-1 space-y-1 px-3">
        {sidebarItems.map((item) => {
          const Icon = icons[item.icon];
          const active = isActive(item.path);

          return (
            <button
              type="button"
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`group flex w-full cursor-pointer items-center rounded-xl px-4 py-3 text-left transition-all duration-150 ease-out active:scale-95 ${
                active
                  ? "bg-[#356DDB] text-[#E8EFFF] shadow-md"
                  : "text-[#AFAFAF] hover:bg-[#E8EFFF] hover:text-[#356DDB]"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center">
                <Icon className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              </span>
              <span
                className={`whitespace-nowrap text-sm font-medium transition-all duration-300 ease-in-out ${
                  isSidebarOpen
                    ? "ml-2 translate-x-0 opacity-100"
                    : "pointer-events-none -translate-x-2 opacity-0"
                }`}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
