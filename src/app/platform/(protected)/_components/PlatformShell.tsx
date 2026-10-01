"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, History, LayoutDashboard, LogOut, Menu, Settings, ShieldCheck, Store, UserRound, X } from "lucide-react";

const navigation = [
  { href: "/platform", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/platform/restaurants", label: "ร้านในระบบ", icon: Store },
  { href: "/platform/logs", label: "ประวัติการดูแลระบบ", icon: History },
  { href: "/platform/settings", label: "ตั้งค่าแพลตฟอร์ม", icon: Settings },
];

function currentTitle(pathname: string) {
  if (/^\/platform\/restaurants\/\d+/.test(pathname)) return "รายละเอียดร้าน";
  return navigation.find(item => item.href === pathname)?.label || "ศูนย์ดูแลแพลตฟอร์ม";
}

export default function PlatformShell({
  adminName,
  platformName,
  logoUrl,
  children,
}: {
  adminName: string;
  platformName: string;
  logoUrl: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    function closeProfile(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", closeProfile);
    return () => document.removeEventListener("mousedown", closeProfile);
  }, []);

  async function logout() {
    const response = await fetch("/api/platform/session", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (response.ok) {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8F8F8] text-gray-900">
      {sidebarOpen && <button type="button" aria-label="ปิดเมนู" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-slate-950/25 lg:hidden" />}

      <aside className={`fixed inset-y-0 left-0 z-50 flex bg-white transition-all duration-300 lg:static lg:z-auto ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${sidebarExpanded ? "w-64" : "w-64 lg:w-20"}`}>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-[88px] items-center gap-3 px-4">
            <button type="button" onClick={() => setSidebarExpanded(value => !value)} aria-label={sidebarExpanded ? "ย่อเมนู" : "ขยายเมนู"} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[#356DDB] transition hover:bg-blue-50">
              <Menu size={23} />
            </button>
            <div className={`min-w-0 transition-all duration-300 ${sidebarExpanded ? "opacity-100" : "lg:pointer-events-none lg:w-0 lg:opacity-0"}`}>
              <div className="flex items-center gap-2">
                {logoUrl ? <img src={logoUrl} alt={`โลโก้ ${platformName}`} className="h-7 w-7 shrink-0 rounded-lg object-contain" /> : <ShieldCheck size={18} className="shrink-0 text-blue-600" />}
                <p className="truncate font-semibold text-gray-900">{platformName}</p>
              </div>
              <p className="mt-1 truncate text-xs text-gray-400">ศูนย์ดูแลแพลตฟอร์ม</p>
            </div>
            <button type="button" onClick={() => setSidebarOpen(false)} aria-label="ปิดเมนู" className="ml-auto rounded-lg p-2 text-gray-400 lg:hidden"><X size={19} /></button>
          </div>

          <nav aria-label="ส่วนจัดการแพลตฟอร์ม" className="flex-1 space-y-1 px-3">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = href === "/platform" ? pathname === href : pathname.startsWith(href);
              return (
                <Link key={href} href={href} onClick={() => setSidebarOpen(false)} aria-current={active ? "page" : undefined} title={!sidebarExpanded ? label : undefined} className={`group flex w-full items-center rounded-xl px-4 py-3 text-left text-sm font-medium transition-all active:scale-[0.98] ${active ? "bg-[#356DDB] text-[#E8EFFF] shadow-md" : "text-[#AFAFAF] hover:bg-[#E8EFFF] hover:text-[#356DDB]"}`}>
                  <span className="grid h-5 w-5 shrink-0 place-items-center"><Icon size={20} className="transition-transform group-hover:scale-110" /></span>
                  <span className={`ml-2 whitespace-nowrap transition-all duration-300 ${sidebarExpanded ? "opacity-100" : "lg:pointer-events-none lg:-translate-x-2 lg:opacity-0"}`}>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <header className="flex w-full items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(true)} aria-label="เปิดเมนู" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-gray-500 shadow-sm lg:hidden"><Menu size={20} /></button>
            <div className="min-w-0"><p className="text-xs text-gray-400">Platform Administration</p><h1 className="truncate text-lg font-semibold text-gray-900 sm:text-xl">{currentTitle(pathname)}</h1></div>
          </div>
          <div ref={profileRef} className="relative">
            <button type="button" onClick={() => setProfileOpen(value => !value)} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm transition hover:shadow-md">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><UserRound size={18} /></span>
              <span className="hidden text-left sm:block"><span className="block text-sm font-medium text-gray-800">{adminName}</span><span className="block text-xs text-gray-400">Platform Admin</span></span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            {profileOpen && <div className="absolute right-0 top-full z-30 mt-2 w-52 rounded-xl border border-gray-100 bg-white p-2 shadow-xl"><button type="button" onClick={() => void logout()} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"><LogOut size={16} />ออกจากระบบ</button></div>}
          </div>
        </header>
        <main className="w-full flex-1 px-4 pb-10 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
