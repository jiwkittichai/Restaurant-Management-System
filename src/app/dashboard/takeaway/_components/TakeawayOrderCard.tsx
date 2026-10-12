import {
  Clock3,
  Eye,
  PackageCheck,
  Phone,
  ReceiptText,
  ShoppingBag,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import type { TakeawayOrder } from "../types";
import { badgeClass, itemStatusText, money, statusText, timeText } from "../utils";

type TakeawayOrderCardProps = {
  order: TakeawayOrder;
  loading: boolean;
  onDetail: (order: TakeawayOrder) => void;
  onBill: (order: TakeawayOrder) => void;
  onPickup: (order: TakeawayOrder) => void;
  onCancel: (order: TakeawayOrder) => void;
};

export default function TakeawayOrderCard({
  order,
  loading,
  onDetail,
  onBill,
  onPickup,
  onCancel,
}: TakeawayOrderCardProps) {
  const preview = order.items.slice(0, 3);
  const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
  const readyToPickup = order.status === "READY" && order.paymentStatus === "PAID";

  return (
    <article id={`order-${order.id}`} className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-500">คิวรับอาหาร</p>
              <h3 title={order.queueNumber} className="break-all text-xl font-semibold text-gray-900">{order.queueNumber}</h3>
            </div>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${badgeClass(order)}`}>
            {readyToPickup ? "พร้อมส่งมอบ" : statusText[order.status] || order.status}
          </span>
        </div>

        <div className="mt-4 grid gap-2 rounded-xl bg-gray-50 p-3.5 text-xs sm:grid-cols-2">
          <span className="flex min-w-0 items-center gap-1 text-gray-500">
            <UserRound size={14} className="shrink-0" />
            <span className="truncate">{order.customerName || "ไม่ระบุชื่อ"}</span>
          </span>
          <span className="flex min-w-0 items-center gap-1 text-gray-500">
            <Phone size={14} className="shrink-0" />
            <span className="truncate">{order.customerPhone || "ไม่ระบุเบอร์"}</span>
          </span>
          <span className="flex items-center gap-1 text-gray-500">
            <Clock3 size={14} /> {timeText(order.createdAt)}
          </span>
          <span className={`font-semibold ${order.paymentStatus === "PAID" ? "text-emerald-600" : "text-red-500"}`}>
            {order.paymentStatus === "PAID" ? "ชำระแล้ว" : "ยังไม่ชำระ"}
          </span>
        </div>

        <div className="mt-4 min-h-[92px] space-y-1.5">
          {preview.map((item) => (
            <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-lg px-1 py-1 text-sm">
              <span className="min-w-0 truncate font-medium text-gray-900">
                <b className="mr-2 text-blue-600">{item.qty}x</b>{item.name}
              </span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
                {itemStatusText[item.status || ""] || item.status || "-"}
              </span>
            </div>
          ))}
          {order.items.length > 3 && <p className="text-xs font-medium text-gray-400">+ อีก {order.items.length - 3} รายการ</p>}
        </div>

        <div className="mt-3 border-t border-gray-100 pt-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-gray-400">{itemCount} รายการ · ยอดรวม</p>
              <p className="text-xl font-semibold text-gray-900">{money(order.total)}</p>
            </div>
            <button onClick={() => onDetail(order)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
              <Eye size={16} /> ดูรายการ
            </button>
          </div>

          <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
            {order.paymentStatus === "UNPAID" ? (
              <button disabled={loading} onClick={() => onBill(order)} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                <ReceiptText size={17} /> เช็คบิล
              </button>
            ) : (
              <button disabled={!readyToPickup || loading} onClick={() => onPickup(order)} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#356DDB] px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400">
                <PackageCheck size={17} /> {order.status === "READY" ? "ลูกค้ารับอาหารแล้ว" : "รอครัว"}
              </button>
            )}
            {order.paymentStatus !== "PAID" && (
              <button onClick={() => onCancel(order)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100">
                <X size={18} />
              </button>
            )}
          </div>

          {order.paymentStatus === "PAID" && (
            <div className="mt-3 flex items-center gap-2 text-sm font-medium text-emerald-600">
              <WalletCards size={16} /> รับชำระเงินแล้ว
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
