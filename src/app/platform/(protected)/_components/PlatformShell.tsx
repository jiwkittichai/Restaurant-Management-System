"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, History, LayoutDashboard, LogOut, Menu, Settings, Store, UserRound } from "lucide-react";

const navigation = [
  { href: "/platform", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/platform/restaurants", label: "ร้านในระบบ", icon: Store },
  { href: "/platform/logs", label: "ประวัติการดูแลระบบ", icon: History },
  { href: "/platform/settings", label: "ตั้งค่าแพลตฟอร์ม", icon: Settings },
];

function currentTitle(pathname: string) {
  if (/^\/platform\/restaurants\/\d+/.test(pathname)) return "รายละเอียดร้าน";
  if (/^\/platform\/logs\/\d+/.test(pathname)) return "รายละเอียดประวัติ";
  return navigation.find(item => item.href === pathname)?.label || "ศูนย์ดูแลแพลตฟอร์ม";
}

export default function PlatformShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const mobileViewport = window.matchMedia("(max-width: 767px)");

    if (mobileViewport.matches) setSidebarOpen(false);

    function handleViewportChange(event: MediaQueryListEvent) {
      setSidebarOpen(!event.matches);
    }

    mobileViewport.addEventListener("change", handleViewportChange);
    return () => mobileViewport.removeEventListener("change", handleViewportChange);
  }, []);

  useEffect(() => {
    function closeProfile(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", closeProfile);
    return () => document.removeEventListener("mousedown", closeProfile);
  }, []);

  useEffect(() => {
    function closeSidebar(event: KeyboardEvent) {
      if (event.key === "Escape" && window.matchMedia("(max-width: 767px)").matches) setSidebarOpen(false);
    }

    window.addEventListener("keydown", closeSidebar);
    return () => window.removeEventListener("keydown", closeSidebar);
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
      <div className="relative h-screen w-0 shrink-0 min-[480px]:w-16 md:w-auto">
        {sidebarOpen && <button type="button" aria-label="ปิดเมนู" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-[1px] md:hidden" />}

        <aside id="platform-sidebar" className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col overflow-hidden bg-white transition-[width,box-shadow] duration-300 ease-in-out md:relative md:z-auto ${sidebarOpen ? "w-64 shadow-2xl md:shadow-none" : "w-0 shadow-none min-[480px]:w-16 md:w-20"}`}>
          <div className="p-4 min-[480px]:p-3 md:p-4">
            <button type="button" onClick={() => setSidebarOpen(value => !value)} aria-label={sidebarOpen ? "ย่อเมนู" : "ขยายเมนู"} aria-expanded={sidebarOpen} aria-controls="platform-sidebar" className="rounded-lg p-2 transition-colors hover:bg-[#E8EFFF] md:p-3">
              <Menu className="h-6 w-6 text-[#356DDB]" />
            </button>
          </div>

          <nav aria-label="ส่วนจัดการแพลตฟอร์ม" className="flex-1 space-y-1 overflow-y-auto px-2 pb-4 md:px-3">
            {navigation.map(({ href, label, icon: Icon }) => {
              const active = href === "/platform" ? pathname === href : pathname.startsWith(href);
              return (
                <Link key={href} href={href} onClick={() => { if (window.matchMedia("(max-width: 767px)").matches) setSidebarOpen(false); }} aria-current={active ? "page" : undefined} title={!sidebarOpen ? label : undefined} className={`group flex w-full items-center rounded-xl px-3 py-3 text-left transition-all duration-150 ease-out active:scale-95 md:px-4 ${active ? "bg-[#356DDB] text-[#E8EFFF] shadow-md" : "text-[#AFAFAF] hover:bg-[#E8EFFF] hover:text-[#356DDB]"}`}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center"><Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" /></span>
                  <span className={`whitespace-nowrap text-sm font-medium transition-all duration-300 ease-in-out ${sidebarOpen ? "ml-2 translate-x-0 opacity-100" : "pointer-events-none -translate-x-2 opacity-0"}`}>{label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-auto">
        <header className="flex w-full items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-10">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(true)} aria-label="เปิดเมนู" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[#356DDB] transition-colors hover:bg-[#E8EFFF] min-[480px]:hidden"><Menu className="h-6 w-6" /></button>
            <div className="min-w-0"><p className="text-xs text-gray-400">Platform Administration</p><h1 className="truncate text-lg font-semibold text-gray-900 sm:text-xl">{currentTitle(pathname)}</h1></div>
          </div>
          <div ref={profileRef} className="relative">
            <button type="button" onClick={() => setProfileOpen(value => !value)} className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 shadow-sm transition hover:shadow-md">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600"><UserRound size={18} /></span>
              <span className="hidden text-left sm:block"><span className="block text-sm font-medium text-gray-800">Admin</span><span className="block text-xs text-gray-400">ผู้ดูแลระบบ</span></span>
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
