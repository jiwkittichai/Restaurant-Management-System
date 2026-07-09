"use client";

import {
  Bell,
  DollarSign,
  House,
  Info,
  Mail,
  Menu,
  Settings,
  ShoppingBag,
  ShoppingCart,
  User,
  CircleAlert,
  ChefHat,
  LayoutGrid,
  UtensilsCrossed,
  Tags,
  PackageOpen,
  ChartNoAxesCombined,
  Users,
} from "lucide-react";

import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

const ICONS: Record<string, React.ElementType> = {
  House,
  DollarSign,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Mail,
  User,
  Bell,
  Info,
  CircleAlert,
  ChefHat,
  LayoutGrid,
  UtensilsCrossed,
  Tags,
  PackageOpen,
  ChartNoAxesCombined,
  Users,
};

type SidebarItem = {
  name: string;
  path: string;
  icon: string;
  roles: string[];
};

const initialSidebarItems: SidebarItem[] = [
  { name: "แดชบอร์ด", path: "/dashboard", icon: "House", roles: ["OWNER"] },
  { name: "รับออเดอร์", path: "/dashboard/orders", icon: "ShoppingCart", roles: ["OWNER", "CASHIER"] },
  { name: "คิวซื้อกลับบ้าน", path: "/dashboard/takeaway", icon: "ShoppingBag", roles: ["OWNER", "CASHIER"] },
  { name: "โต๊ะอาหาร", path: "/dashboard/tables", icon: "LayoutGrid", roles: ["OWNER", "CASHIER"] },
  { name: "หน้าจอครัว", path: "/dashboard/kitchen", icon: "ChefHat", roles: ["OWNER", "KITCHEN"] },
  { name: "สต็อกวัตถุดิบ", path: "/dashboard/inventory", icon: "PackageOpen", roles: ["OWNER", "STOCK"] },
  { name: "เมนูอาหาร", path: "/dashboard/products", icon: "UtensilsCrossed", roles: ["OWNER"] },
  { name: "หมวดหมู่", path: "/dashboard/categories", icon: "Tags", roles: ["OWNER"] },
  { name: "รายงานยอดขาย", path: "/dashboard/reports", icon: "ChartNoAxesCombined", roles: ["OWNER"] },
  { name: "จัดการพนักงาน", path: "/dashboard/employees", icon: "Users", roles: ["OWNER"] },
];

const Sidebar = ({ roles }: { roles: string[] }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const pathname = usePathname();
  const router = useRouter();

  const sidebarItems = initialSidebarItems.filter(item => item.roles.some(role => roles.includes(role)));

  // แก้ isActive ให้ปุ่มไหนตรง pathname เท่านั้นถึง active
  const isActive = (path: string) => pathname === path;

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <aside
      className={`
        h-screen bg-white flex flex-col
        transition-all duration-300 ease-in-out
        ${isSidebarOpen ? "w-64" : "w-20"}
      `}
    >
      {/* Toggle */}
      <div className="p-4">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-3"
        >
          <Menu className="w-6 h-6 text-[#356DDB]" />
        </button>
      </div>

      {/* Menu */}
      <div className="flex-1 px-3 space-y-1">
        {sidebarItems.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(item.path);

          return (
            <div
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              className={`
                group flex items-center px-4 py-3 rounded-xl cursor-pointer
                transition-all duration-150 ease-out active:scale-95
                ${
                  active
                    ? "bg-[#356DDB] text-[#E8EFFF] shadow-md"
                    : "text-[#AFAFAF] hover:bg-[#E8EFFF] hover:text-[#356DDB]"
                }
              `}
            >
              <div className="flex justify-center items-center w-5 h-5">
                {Icon && (
                  <Icon className="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                )}
              </div>

              <span
                className={`
                  text-sm font-medium whitespace-nowrap
                  transition-all duration-300 ease-in-out
                  ${
                    isSidebarOpen
                      ? "opacity-100 translate-x-0 ml-2"
                      : "opacity-0 -translate-x-2 pointer-events-none"
                  }
                `}
              >
                {item.name}
              </span>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;
