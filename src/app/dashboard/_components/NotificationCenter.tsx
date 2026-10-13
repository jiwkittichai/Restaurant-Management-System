/**
 * NotificationCenter แสดงรายการแจ้งเตือนล่าสุดของร้าน
 * ใช้จัดการข้อมูลบนหน้าจอ ติดต่อ API และแจ้งผลสำเร็จหรือข้อผิดพลาดให้ผู้ใช้
 */

"use client";

import {
  ArrowUpRight,
  Bell,
  BellOff,
  ChefHat,
  PackageOpen,
  ReceiptText,
  ShoppingBag,
  Utensils,
  X,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { hasAnyDashboardRole } from "../roles";

type Notification = {
  id: string;
  text: string;
  href: string;
  kind: string;
  revision: string;
};

type NotificationVisual = {
  icon: LucideIcon;
  label: string;
  iconClass: string;
};

const notificationVisuals: Record<string, NotificationVisual> = {
  bill: { icon: ReceiptText, label: "เรียกเก็บเงิน", iconClass: "bg-amber-50 text-amber-600" },
  ready: { icon: Utensils, label: "อาหารพร้อมเสิร์ฟ", iconClass: "bg-emerald-50 text-emerald-600" },
  pickup: { icon: ShoppingBag, label: "พร้อมรับสินค้า", iconClass: "bg-violet-50 text-violet-600" },
  new: { icon: ChefHat, label: "รายการเข้าครัว", iconClass: "bg-blue-50 text-blue-600" },
  stock: { icon: PackageOpen, label: "แจ้งเตือนสต็อก", iconClass: "bg-red-50 text-red-500" },
};

const fallbackVisual: NotificationVisual = {
  icon: Bell,
  label: "การแจ้งเตือน",
  iconClass: "bg-blue-50 text-blue-600",
};

export default function NotificationCenter({ roles }: { roles: string[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const notificationRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<Notification | null>(null);
  const canNotify = hasAnyDashboardRole(roles, [
    "OWNER",
    "CASHIER",
    "KITCHEN",
    "STOCK",
  ]);

  function openNotification(item: Notification) {
    setOpen(false);
    setToast(null);
    const [path, anchor] = item.href.split("#");
    if (pathname === path) {
      if (window.location.hash === `#${anchor}`) {
        window.dispatchEvent(new Event("notification-target"));
      } else {
        window.location.hash = anchor;
      }
    } else {
      router.push(item.href);
    }
  }

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 7000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    function closePopover(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setOpen(false);
    }
    function closeWithEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", closePopover);
    window.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", closePopover);
      window.removeEventListener("keydown", closeWithEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!canNotify) return;
    let stopped = false;
    let previous: Map<string, string> | null = null;
    let previousPayload = "";
    let inFlight = false;
    let delay = 5000;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();

    async function load() {
      if (stopped || inFlight || document.hidden) return;
      inFlight = true;
      try {
        const response = await fetch("/api/qr-notifications", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (response.status === 401 || response.status === 403) {
          stopped = true;
          setNotifications([]);
          setToast(null);
          return;
        }
        if (!response.ok) throw new Error("notification unavailable");

        const items: Notification[] = await response.json();
        delay = 5000;
        const payload = JSON.stringify(items);
        if (!stopped && payload !== previousPayload) {
          previousPayload = payload;
          setNotifications(items);
          const fresh = previous
            ? items.find((item) => {
                const before = previous?.get(item.id);
                if (before === undefined) return true;
                if (item.kind === "new" || item.kind === "ready") {
                  const oldItems = new Set(before.split(","));
                  return item.revision
                    .split(",")
                    .some((id) => !oldItems.has(id));
                }
                return before !== item.revision;
              })
            : items.find((item) => item.kind === "bill");
          if (fresh) {
            setToast(fresh);
          } else {
            setToast((current) =>
              current && items.some((item) => item.id === current.id)
                ? current
                : null,
            );
          }
          previous = new Map(items.map((item) => [item.id, item.revision]));
        }
      } catch {
        delay = Math.min(delay * 2, 60000);
      } finally {
        inFlight = false;
        if (!stopped && !document.hidden) {
          timer = setTimeout(load, delay);
        }
      }
    }

    function visibilityChanged() {
      clearTimeout(timer);
      if (!document.hidden) void load();
    }

    document.addEventListener("visibilitychange", visibilityChanged);
    void load();
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller.abort();
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [canNotify]);

  return (
    <>
      <div ref={notificationRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls="notification-popover"
          title="การแจ้งเตือน"
          className={`relative grid h-10 w-10 place-items-center rounded-full transition ${open ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:bg-white hover:text-gray-700"}`}
        >
          <Bell className="h-5 w-5" />
          {!!notifications.length && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#F8F8F8] bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
              {notifications.length > 99 ? "99+" : notifications.length}
            </span>
          )}
        </button>

        {open && (
          <section
            id="notification-popover"
            role="dialog"
            aria-label="การแจ้งเตือน"
            className="fixed right-4 top-20 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-slate-200/60 lg:right-10"
          >
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-4 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                  <Bell size={19} />
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900">การแจ้งเตือน</h2>
                  <p className="mt-0.5 text-xs text-gray-400">
                    {notifications.length ? `${notifications.length.toLocaleString("th-TH")} รายการที่รอดำเนินการ` : "ติดตามงานที่ต้องดำเนินการ"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="ปิดการแจ้งเตือน"
                title="ปิด"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={18} />
              </button>
            </div>

            {notifications.length ? (
              <div className="max-h-[min(65dvh,32rem)] space-y-1 overflow-y-auto p-2">
                {notifications.map((item) => {
                  const visual = notificationVisuals[item.kind] || fallbackVisual;
                  const Icon = visual.icon;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => openNotification(item)}
                      className="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                    >
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${visual.iconClass}`}>
                        <Icon size={19} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-medium text-gray-400">{visual.label}</span>
                        <span className="mt-0.5 block text-sm font-medium leading-5 text-gray-800">{item.text}</span>
                      </span>
                      <ArrowUpRight size={16} className="shrink-0 text-gray-300 transition group-hover:text-blue-500" />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gray-50 text-gray-300">
                  <BellOff size={22} />
                </span>
                <p className="mt-3 text-sm font-medium text-gray-700">ไม่มีรายการแจ้งเตือน</p>
                <p className="mt-1 text-xs text-gray-400">งานที่ต้องดำเนินการจะแสดงที่นี่</p>
              </div>
            )}
          </section>
        )}
      </div>

      <span role="status" className="sr-only">
        แจ้งเตือน {notifications.length} รายการ
      </span>

      {toast && !open && (
        (() => {
          const visual = notificationVisuals[toast.kind] || fallbackVisual;
          const Icon = visual.icon;
          return (
            <div
              role="status"
              className="fixed right-4 top-20 z-50 flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl shadow-slate-200/60 lg:right-10"
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${visual.iconClass}`}>
                <Icon size={19} />
              </span>
              <button onClick={() => openNotification(toast)} className="min-w-0 flex-1 py-0.5 text-left">
                <span className="block text-xs font-medium text-gray-400">{visual.label}</span>
                <span className="mt-0.5 block text-sm font-medium leading-5 text-gray-800">{toast.text}</span>
              </button>
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="ปิดข้อความแจ้งเตือน"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            </div>
          );
        })()
      )}
    </>
  );
}
