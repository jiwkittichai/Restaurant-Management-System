/**
 * TableCard แสดงข้อมูลแบบการ์ดในส่วนโต๊ะและออเดอร์ภายในร้าน
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import { Armchair, Eye, Pencil, ReceiptText, Trash2, Utensils, X } from "lucide-react";
import type { ActiveOrder, RestaurantTable } from "../types";
import {
  itemStatusText,
  money,
  orderStatusClass,
  orderStatusText,
  statusClass,
  statusText,
  timeText,
} from "../utils";
import TableQr from "./TableQr";

type TableCardProps = {
  table: RestaurantTable;
  onReload: () => void;
  onStatusChange: (id: number, status: string) => void;
  onOpenDetail: (table: RestaurantTable, order: ActiveOrder) => void;
  onOpenBill: (table: RestaurantTable, order: ActiveOrder) => void;
  onCancel: (order: ActiveOrder) => void;
  showManagementActions: boolean;
  onEdit: (table: RestaurantTable) => void;
  onDelete: (table: RestaurantTable) => void;
};

export default function TableCard({
  table,
  onReload,
  onStatusChange,
  onOpenDetail,
  onOpenBill,
  onCancel,
  showManagementActions,
  onEdit,
  onDelete,
}: TableCardProps) {
  const order = table.orders[0];
  const itemCount = order?.items.reduce((sum, item) => sum + item.qty, 0) || 0;
  const previewItems = order?.items.slice(0, 3) || [];

  return (
    <article
      id={`table-${table.id}`}
      className={`overflow-hidden rounded-2xl border bg-white ${order ? "border-blue-100 shadow-sm" : "border-gray-100"}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`grid h-11 w-11 place-items-center rounded-xl ${order ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"}`}>
              <Armchair size={22} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{table.name}</h3>
              <p className="text-sm text-gray-400">{table.seats} ที่นั่ง</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className={`rounded-full px-3 py-1 text-xs ${statusClass[table.status]}`}>
              {statusText[table.status]}
            </span>
            {showManagementActions && (
              <>
                <button type="button" onClick={() => onEdit(table)} aria-label={`แก้ไข ${table.name}`} title="แก้ไขโต๊ะ" className="rounded-lg p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"><Pencil size={16} /></button>
                <button type="button" onClick={() => onDelete(table)} aria-label={`ลบ ${table.name}`} title="ลบโต๊ะ" className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-500"><Trash2 size={16} /></button>
              </>
            )}
          </div>
        </div>

        {order ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl bg-gray-50 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="min-w-0 truncate text-xs font-medium text-gray-400">{order.orderNumber}</p>
                <span className={`rounded-full px-2.5 py-1 text-xs ${orderStatusClass[order.status] || "bg-gray-100 text-gray-500"}`}>
                  {orderStatusText[order.status] || order.status}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 text-xs">
                <div><p className="text-gray-400">เปิดโต๊ะ</p><p className="mt-1 font-medium text-gray-700">{timeText(order.createdAt)}</p></div>
                <div><p className="text-gray-400">รายการ</p><p className="mt-1 font-medium text-gray-700">{itemCount} รายการ</p></div>
                <div><p className="text-gray-400">ชำระเงิน</p><p className="mt-1 font-medium text-red-500">ยังไม่ชำระ</p></div>
              </div>
            </div>

            <div className="space-y-1.5">
              {previewItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg px-1 py-1 text-sm">
                  <span className="min-w-0 truncate"><b className="mr-2 text-blue-600">{item.qty}x</b>{item.name}</span>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                    {itemStatusText[item.status || ""] || item.status}
                  </span>
                </div>
              ))}
              {order.items.length > 3 && <p className="text-xs text-gray-400">+ อีก {order.items.length - 3} รายการ</p>}
            </div>

            <div className="flex items-end justify-between border-t border-gray-100 pt-3">
              <div>
                <p className="text-xs text-gray-400">ยอดบิล</p>
                <p className="text-xl font-semibold text-gray-900">{money(order.total)}</p>
              </div>
              <button onClick={() => onOpenDetail(table, order)} className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600">
                <Eye size={16} /> ดูรายการ
              </button>
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button data-notification-bill onClick={() => onOpenBill(table, order)} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm text-white">
                <ReceiptText size={16} /> เช็คบิล
              </button>
              <button onClick={() => onCancel(order)} className="rounded-xl bg-red-50 px-3 text-red-500">
                <X size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 p-4 text-center">
              <Utensils className="text-gray-300" size={24} />
              <p className="mt-2 text-sm text-gray-400">ยังไม่มีออเดอร์</p>
            </div>
            <div className="pt-4">
              <button
                disabled={Boolean(table.sessions?.length)}
                onClick={() => onStatusChange(table.id, table.status === "RESERVED" ? "AVAILABLE" : "RESERVED")}
                className="w-full rounded-xl bg-amber-50 py-2.5 text-sm text-amber-700"
              >
                {table.status === "RESERVED" ? "ยกเลิกจอง" : "จองโต๊ะ"}
              </button>
            </div>
          </div>
        )}

        <TableQr tableId={table.id} session={table.sessions?.[0]} hasOrder={Boolean(order)} reload={onReload} />
      </div>
    </article>
  );
}
