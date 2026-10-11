"use client";

import { Bell, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { hasAnyDashboardRole } from "../roles";

type Notification = {
  id: string;
  text: string;
  href: string;
  kind: string;
  revision: string;
};

const notificationSymbol: Record<string, string> = {
  bill: "🔔",
  ready: "🍽️",
  pickup: "🛍️",
  new: "🧑‍🍳",
  stock: "📦",
};

export default function NotificationCenter({ roles }: { roles: string[] }) {
  const pathname = usePathname();
  const router = useRouter();
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
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        title="การแจ้งเตือน"
        className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full text-gray-500 transition hover:bg-white hover:text-gray-700"
      >
        <Bell className="h-5 w-5 text-gray-500" />
        {!!notifications.length && (
          <span className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full bg-red-500 px-1 text-xs text-white">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed right-4 top-20 z-50 max-h-[70dvh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-gray-100 bg-white p-4 shadow-lg">
          <div className="mb-3 flex justify-between">
            <b>การแจ้งเตือน</b>
            <button
              onClick={() => setOpen(false)}
              className="text-sm text-gray-500"
            >
              ปิด
            </button>
          </div>
          {notifications.length ? (
            notifications.map((item) => (
              <button
                key={item.id}
                onClick={() => openNotification(item)}
                className={`mb-2 block w-full rounded-xl p-3 text-left text-sm ${
                  item.kind === "bill"
                    ? "bg-amber-50 text-amber-900"
                    : "bg-blue-50 text-blue-800"
                }`}
              >
                <span className="mr-2" aria-hidden="true">
                  {notificationSymbol[item.kind]}
                </span>
                {item.text}
              </button>
            ))
          ) : (
            <p className="text-sm text-gray-400">ไม่มีรายการที่รอดำเนินการ</p>
          )}
        </div>
      )}

      <span role="status" className="sr-only">
        แจ้งเตือน {notifications.length} รายการ
      </span>

      {toast && !open && (
        <div
          role="status"
          className="fixed right-4 top-20 z-50 flex w-[min(24rem,calc(100vw-2rem))] items-start gap-2 rounded-2xl border border-blue-100 bg-white p-4 shadow-lg"
        >
          <button
            onClick={() => openNotification(toast)}
            className="flex-1 text-left text-sm font-medium text-slate-800"
          >
            <span className="mr-2" aria-hidden="true">
              {notificationSymbol[toast.kind]}
            </span>
            {toast.text}
          </button>
          <button
            onClick={() => setToast(null)}
            aria-label="ปิดข้อความแจ้งเตือน"
            className="p-1 text-slate-400"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );
}
