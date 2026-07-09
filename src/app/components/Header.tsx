"use client";

import React from "react";
import { Bell, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const roleText:Record<string,string>={OWNER:"เจ้าของร้าน",CASHIER:"แคชเชียร์",KITCHEN:"พนักงานครัว",STOCK:"พนักงานสต็อก"};

const Header = ({ user }: { user: { displayName:string; username:string; roles:string[] } }) => {
  const pathname = usePathname();
  const router = useRouter();
  const titles: Record<string, string> = {
    "/dashboard": "ภาพรวมร้านอาหาร",
    "/dashboard/orders": "รับออเดอร์",
    "/dashboard/takeaway": "คิวซื้อกลับบ้าน",
    "/dashboard/tables": "จัดการโต๊ะ",
    "/dashboard/kitchen": "หน้าจอครัว",
    "/dashboard/inventory": "สต็อกและสูตรอาหาร",
    "/dashboard/products": "เมนูอาหาร",
    "/dashboard/products/create": "เพิ่มเมนูอาหาร",
    "/dashboard/categories": "หมวดหมู่เมนู",
    "/dashboard/reports": "รายงานยอดขาย",
    "/dashboard/employees": "จัดการพนักงาน",
  };
  async function logout(){await fetch("/api/auth/logout",{method:"POST"});router.replace("/login");router.refresh();}

  return (
    <div className="w-full px-6 lg:px-10 py-5 flex items-center justify-between">

      {/* LEFT */}
      <div className="flex flex-col gap-1">
        <p className="text-sm text-gray-400">
          Restaurant Management System
        </p>
        <h1 className="text-xl font-semibold text-[#1e1e1e] leading-tight">
          {pathname.includes("/dashboard/products/") && pathname.endsWith("/edit") ? "แก้ไขเมนูอาหาร" : titles[pathname] || "จัดการร้านอาหาร"}
        </h1>
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-5 lg:gap-8">

        {/* NOTIFICATION */}
        <div className="relative cursor-pointer">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        </div>

        {/* PROFILE */}
        <div className="flex items-center gap-3 pl-2 border-l border-gray-200">

          {/* TEXT */}
          <div className="text-right leading-tight">
            <p className="text-xs text-gray-400">
              {user.roles.map(role=>roleText[role]||role).join(" · ")}
            </p>
            <p className="text-sm font-medium text-gray-800">
              {user.displayName}
            </p>
          </div>

          {/* AVATAR */}
          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center font-semibold">{user.displayName.charAt(0)}</div>
          <button onClick={logout} title="ออกจากระบบ" className="p-2 text-gray-400 hover:text-red-500"><LogOut size={18}/></button>
        </div>

      </div>
    </div>
  );
};

export default Header;
