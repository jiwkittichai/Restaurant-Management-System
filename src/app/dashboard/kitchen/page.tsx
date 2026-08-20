"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChefHat, Clock3, RefreshCw } from "lucide-react";

type Item = { id: number; name: string; qty: number; note?: string; status: string };
type Order = {
  id: number;
  orderNumber: string;
  type: string;
  queueNumber?: string;
  customerName?: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  table?: { name: string };
  items: Item[];
};

const itemText: Record<string, string> = { NEW: "รอทำ", PREPARING: "กำลังทำ", READY: "พร้อม", SERVED: "เสิร์ฟแล้ว" };
const itemBadgeClass: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-500",
  PREPARING: "bg-amber-100 text-amber-700",
  READY: "bg-emerald-100 text-emerald-700",
  SERVED: "bg-blue-100 text-blue-700",
};

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(
    () => fetch("/api/orders").then((response) => response.json()).then(setOrders).catch(() => setError("โหลดออเดอร์ไม่สำเร็จ")),
    [],
  );

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  const itemCount = useMemo(() => orders.reduce((sum, order) => sum + order.items.length, 0), [orders]);

  async function update(itemId: number, status: string) {
    const response = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "item-status", itemId, status }),
    });
    if (!response.ok) setError("อัปเดตสถานะไม่สำเร็จ");
    else load();
  }

  function actionLabel(order: Order, item: Item) {
    if (item.status === "NEW") return "เริ่มทำ";
    if (item.status === "PREPARING") return order.type === "TAKEAWAY" ? "พร้อมรับ" : "พร้อมเสิร์ฟ";
    if (item.status === "READY" && order.type === "DINE_IN") return "เสิร์ฟแล้ว";
    return "";
  }

  function nextStatus(item: Item) {
    if (item.status === "NEW") return "PREPARING";
    if (item.status === "PREPARING") return "READY";
    if (item.status === "READY") return "SERVED";
    return "";
  }

  return (
    <div className="p-4 sm:p-6 overflow-y-auto">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-400">อัปเดตอัตโนมัติทุก 10 วินาที</p>
          <p className="mt-1 text-sm font-medium text-gray-700">กำลังทำ {orders.length} ออเดอร์ · {itemCount} รายการ</p>
        </div>
        <button onClick={load} className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm text-gray-600">
          <RefreshCw size={15} /> รีเฟรช
        </button>
      </div>

      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {orders.map((order) => (
          <article key={order.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <header className={`px-4 py-3 text-white ${order.type === "TAKEAWAY" ? "bg-[#356DDB]" : "bg-[#212A3A]"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{order.type === "TAKEAWAY" ? `คิว ${order.queueNumber}` : order.table?.name}</p>
                  <p className="mt-0.5 truncate text-xs text-white/75">{order.customerName || order.orderNumber} · {order.paymentStatus === "PAID" ? "ชำระแล้ว" : "ยังไม่ชำระ"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs text-white/75">
                  <Clock3 size={14} />
                  {new Date(order.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </header>

            <div className="divide-y divide-gray-100">
              {order.items.map((item) => {
                const label = actionLabel(order, item);
                const status = nextStatus(item);
                return (
                  <div key={item.id} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="shrink-0 text-sm font-semibold text-blue-600">{item.qty}x</span>
                          <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                        </div>
                        {item.note && <p className="mt-1 truncate text-xs text-red-500">หมายเหตุ: {item.note}</p>}
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] ${itemBadgeClass[item.status] || "bg-gray-100 text-gray-500"}`}>
                        {itemText[item.status]}
                      </span>
                      {label && (
                        <button
                          onClick={() => update(item.id, status)}
                          className={`shrink-0 rounded-lg px-3 py-1.5 text-xs text-white ${
                            item.status === "NEW" ? "bg-amber-500" : item.status === "PREPARING" ? "bg-emerald-600" : "bg-blue-600"
                          }`}
                        >
                          {label}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      {!orders.length && (
        <div className="mt-20 text-center text-gray-400">
          <ChefHat size={48} className="mx-auto mb-3 opacity-30" />
          <p>ยังไม่มีออเดอร์เข้าครัว</p>
        </div>
      )}
    </div>
  );
}
