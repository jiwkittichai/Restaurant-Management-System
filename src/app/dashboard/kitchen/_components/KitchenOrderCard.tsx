/**
 * KitchenOrderCard แสดงข้อมูลแบบการ์ดในส่วนงานภายในครัว
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import { BookOpenText, Clock3 } from "lucide-react";
import type { KitchenItem, KitchenOrder } from "../types";
import { itemBadgeClass, itemText } from "../utils";

type KitchenOrderCardProps = {
  order: KitchenOrder;
  onUpdate: (itemId: number, status: string) => void;
  onOpenRecipe: (order: KitchenOrder, item: KitchenItem) => void;
};

function actionLabel(order: KitchenOrder, item: KitchenItem) {
  if (item.status === "NEW") return "เริ่มทำ";
  if (item.status === "PREPARING") return order.type === "TAKEAWAY" ? "พร้อมรับ" : "พร้อมเสิร์ฟ";
  if (item.status === "READY" && order.type === "DINE_IN") return "เสิร์ฟแล้ว";
  return "";
}

function nextStatus(item: KitchenItem) {
  if (item.status === "NEW") return "PREPARING";
  if (item.status === "PREPARING") return "READY";
  if (item.status === "READY") return "SERVED";
  return "";
}

export default function KitchenOrderCard({ order, onUpdate, onOpenRecipe }: KitchenOrderCardProps) {
  return (
    <article id={`order-${order.id}`} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <header className={`px-4 py-3 text-white ${order.type === "TAKEAWAY" ? "bg-[#356DDB]" : "bg-[#212A3A]"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-semibold">{order.type === "TAKEAWAY" ? `คิว ${order.queueNumber}` : order.table?.name}</p>
            <p className="mt-0.5 truncate text-xs text-white/75">
              {order.customerName || order.orderNumber} · {order.paymentStatus === "PAID" ? "ชำระแล้ว" : "ยังไม่ชำระ"}
            </p>
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 text-sm font-semibold text-blue-600">{item.qty}x</span>
                    <p className="truncate text-sm font-medium text-gray-900">
                      {item.name}
                      {item.source === "QR" && <span className="ml-2 text-[10px] text-blue-600">QR</span>}
                    </p>
                  </div>
                  {!!item.modifiers?.length && (
                    <p className="mt-1 truncate text-xs text-blue-600">
                      {item.modifiers.map((modifier) => `+ ${modifier.name}`).join(", ")}
                    </p>
                  )}
                  {item.note && <p className="mt-1 truncate text-xs text-red-500">หมายเหตุ: {item.note}</p>}
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                  <span className={`rounded-full px-2 py-1 text-[11px] ${itemBadgeClass[item.status] || "bg-gray-100 text-gray-500"}`}>
                    {itemText[item.status]}
                  </span>
                  <button
                    type="button"
                    title="ดูสูตรอาหาร"
                    aria-label={`ดูสูตรอาหาร ${item.name}`}
                    onClick={() => onOpenRecipe(order, item)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-100 px-2.5 text-xs font-medium text-gray-600 transition hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <BookOpenText size={14} /> สูตร
                  </button>
                  {label && (
                    <button
                      onClick={() => onUpdate(item.id, status)}
                      className={`rounded-lg px-3 py-1.5 text-xs text-white ${
                        item.status === "NEW" ? "bg-amber-500" : item.status === "PREPARING" ? "bg-emerald-600" : "bg-blue-600"
                      }`}
                    >
                      {label}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
