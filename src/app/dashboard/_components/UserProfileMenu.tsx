/**
 * UserProfileMenu แสดงข้อมูลผู้ใช้และเมนูจัดการบัญชี
 * ใช้จัดการข้อมูลบนหน้าจอ ติดต่อ API และแจ้งผลสำเร็จหรือข้อผิดพลาดให้ผู้ใช้
 */

"use client";

import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { dashboardRoleLabel } from "../roles";

type UserProfile = {
  displayName: string;
  username: string;
  roles: string[];
};

export default function UserProfileMenu({ user }: { user: UserProfile }) {
  const router = useRouter();
  const profileRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const roleLabels = user.roles.map(dashboardRoleLabel);
  const roleTitle = roleLabels.join(" · ");

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  useEffect(() => {
    function close(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div
      ref={profileRef}
      className="relative flex min-w-0 items-center border-l border-gray-200 pl-4"
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex min-w-0 items-center gap-2 rounded-full py-1 pl-1 pr-2 transition hover:bg-white"
        aria-expanded={open}
        title="บัญชีผู้ใช้"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
          {user.displayName.charAt(0)}
        </span>
        <ChevronDown
          size={16}
          className={`hidden text-gray-400 transition sm:block ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="fixed right-4 top-20 z-50 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-lg shadow-slate-200/60 lg:right-10">
          <div className="flex items-center gap-3 border-b border-gray-100 p-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-slate-200 font-semibold text-slate-700">
              {user.displayName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900">
                {user.displayName}
              </p>
              <p className="truncate text-xs text-gray-400">@{user.username}</p>
            </div>
          </div>
          <div className="p-4">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-gray-400">
              <UserRound size={14} />
              บทบาทในระบบ
            </div>
            <div className="flex flex-wrap gap-2" title={roleTitle}>
              {roleLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 border-t border-gray-100 px-4 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50"
          >
            <LogOut size={16} />
            ออกจากระบบ
          </button>
        </div>
      )}
    </div>
  );
}
