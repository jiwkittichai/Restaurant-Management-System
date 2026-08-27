"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, UserRound } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const roleText:Record<string,string>={OWNER:"เจ้าของร้าน",CASHIER:"แคชเชียร์",KITCHEN:"พนักงานครัว",STOCK:"พนักงานสต็อก"};

const Header = ({ user }: { user: { displayName:string; username:string; roles:string[] } }) => {
  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const roleLabels = user.roles.map(role=>roleText[role]||role);
  const roleTitle = roleLabels.join(" · ");
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
    "/dashboard/settings": "ตั้งค่า",
    "/dashboard/settings/payments": "ตั้งค่า",
    "/dashboard/employees": "จัดการพนักงาน",
    "/dashboard/employees/create": "เพิ่มพนักงาน",
    "/dashboard/audits": "ประวัติกิจกรรม",
  };
  async function logout(){await fetch("/api/auth/logout",{method:"POST"});router.replace("/login");router.refresh();}
  useEffect(()=>{
    function close(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  },[]);

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
      <div className="flex min-w-0 items-center gap-4">

        {/* NOTIFICATION */}
        <button type="button" title="การแจ้งเตือน" className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-gray-500 transition hover:bg-white hover:text-gray-700">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
        </button>

        {/* PROFILE */}
        <div ref={profileRef} className="relative flex min-w-0 items-center border-l border-gray-200 pl-4">

          <button
            type="button"
            onClick={() => setProfileOpen(open => !open)}
            className="flex min-w-0 items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-white"
            aria-expanded={profileOpen}
            title="บัญชีผู้ใช้"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">{user.displayName.charAt(0)}</span>
            <ChevronDown size={16} className={`hidden text-gray-400 transition sm:block ${profileOpen ? "rotate-180" : ""}`} />
          </button>

          {profileOpen&&(
            <div className="fixed right-4 top-20 z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg shadow-slate-200/60 lg:right-10">
              <div className="flex items-center gap-3 border-b border-gray-100 p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-200 font-semibold text-slate-700">{user.displayName.charAt(0)}</div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">{user.displayName}</p>
                  <p className="truncate text-xs text-gray-400">@{user.username}</p>
                </div>
              </div>
              <div className="p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-400">
                  <UserRound size={14} />
                  บทบาทในระบบ
                </div>
                <div className="flex flex-wrap gap-2" title={roleTitle}>
                  {roleLabels.map(label=>(
                    <span key={label} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600">{label}</span>
                  ))}
                </div>
              </div>
              <button onClick={logout} className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50">
                <LogOut size={16} />
                ออกจากระบบ
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Header;
