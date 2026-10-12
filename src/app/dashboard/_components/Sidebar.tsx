"use client";

import {
  BookOpenText,
  ChartNoAxesCombined,
  ChefHat,
  History,
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
import { useEffect, type ElementType } from "react";
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
  History,
  Users,
  Settings,
};

export default function Sidebar({
  roles,
  isOpen,
  onClose,
  onToggle,
}: {
  roles: string[];
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}) {
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

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && window.matchMedia("(max-width: 767px)").matches) {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  function navigate(path: string) {
    router.push(path);

    if (window.matchMedia("(max-width: 767px)").matches) {
      onClose();
    }
  }

  return (
    <div className="relative h-screen w-0 shrink-0 min-[480px]:w-16 md:w-auto">
      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-[1px] md:hidden"
          aria-label="ปิดเมนู"
          onClick={onClose}
        />
      ) : null}

      <aside
        id="dashboard-sidebar"
        className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col overflow-hidden bg-white transition-[width,box-shadow] duration-300 ease-in-out md:relative md:z-auto ${
          isOpen
            ? "w-64 shadow-2xl md:shadow-none"
            : "w-0 shadow-none min-[480px]:w-16 md:w-20"
        }`}
      >
        <div className="p-4 min-[480px]:p-3 md:p-4">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-lg p-2 transition-colors hover:bg-[#E8EFFF] md:p-3"
            aria-label={isOpen ? "ย่อเมนู" : "ขยายเมนู"}
            aria-expanded={isOpen}
            aria-controls="dashboard-sidebar"
          >
            <Menu className="h-6 w-6 text-[#356DDB]" />
          </button>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-4 md:px-3">
          {sidebarItems.map((item) => {
            const Icon = icons[item.icon];
            const active = isActive(item.path);

            return (
              <button
                type="button"
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`group flex w-full cursor-pointer items-center rounded-xl px-3 py-3 text-left transition-all duration-150 ease-out active:scale-95 md:px-4 ${
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
                    isOpen
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
    </div>
  );
}
