/**
 * OrderCart แสดงรายการอาหารที่เลือกและยอดรวมก่อนสร้างออเดอร์
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import { Minus, Package, Plus, Trash2, Utensils } from "lucide-react";
import type {
  ActiveOrder,
  CartItem,
  ModifierGroup,
  OrderType,
  RestaurantTable,
} from "../types";
import { lineUnitPrice, saleUnit } from "../utils";

type Props = {
  cart: CartItem[];
  tables: RestaurantTable[];
  activeOrder?: ActiveOrder;
  orderType: OrderType;
  tableId: string;
  customerName: string;
  customerPhone: string;
  discount: string;
  note: string;
  message: string;
  loading: boolean;
  subtotal: number;
  combinedTotal: number;
  onOrderType: (value: OrderType) => void;
  onTableId: (value: string) => void;
  onCustomerName: (value: string) => void;
  onCustomerPhone: (value: string) => void;
  onDiscount: (value: string) => void;
  onNote: (value: string) => void;
  onItemNote: (lineId: string, value: string) => void;
  onQuantity: (lineId: string, delta: number) => void;
  onModifier: (
    lineId: string,
    group: ModifierGroup,
    modifierId: number,
  ) => void;
  onRemove: (lineId: string) => void;
  onSubmit: () => void;
};

export default function OrderCart(props: Props) {
  const {
    cart,
    tables,
    activeOrder,
    orderType,
    tableId,
    customerName,
    customerPhone,
    discount,
    note,
    message,
    loading,
    subtotal,
    combinedTotal,
  } = props;
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-5">
      <h2 className="text-lg font-semibold">รายการออเดอร์</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => props.onOrderType("DINE_IN")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm ${orderType === "DINE_IN" ? "bg-[#212A3A] text-white" : "bg-gray-100 text-gray-500"}`}
        >
          <Utensils size={16} /> ทานที่ร้าน
        </button>
        <button
          onClick={() => props.onOrderType("TAKEAWAY")}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm ${orderType === "TAKEAWAY" ? "bg-[#356DDB] text-white" : "bg-gray-100 text-gray-500"}`}
        >
          <Package size={16} /> ซื้อกลับบ้าน
        </button>
      </div>
      {orderType === "DINE_IN" ? (
        <>
          <select
            value={tableId}
            onChange={(event) => props.onTableId(event.target.value)}
            className="mt-3 rounded-xl border border-gray-200 bg-white px-3 py-2.5"
          >
            <option value="">เลือกโต๊ะอาหาร</option>
            {tables
              .filter((table) =>
                ["AVAILABLE", "OCCUPIED"].includes(table.status),
              )
              .map((table) => (
                <option key={table.id} value={table.id}>
                  {table.name}
                  {table.orders[0]
                    ? ` · เพิ่มในบิล ${table.orders[0].orderNumber}`
                    : ""}
                </option>
              ))}
          </select>
          {activeOrder && (
            <div className="mt-2 rounded-xl border border-amber-100 bg-amber-50 p-3">
              <p className="text-sm font-medium text-amber-800">
                กำลังเพิ่มรายการในบิลเดิม
              </p>
              <div className="mt-1 flex justify-between text-xs text-amber-700">
                <span>
                  {activeOrder.orderNumber} ·{" "}
                  {activeOrder.items.reduce((sum, item) => sum + item.qty, 0)}{" "}
                  รายการ
                </span>
                <span>ยอดเดิม ฿{activeOrder.total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <input
            value={customerName}
            onChange={(event) => props.onCustomerName(event.target.value)}
            placeholder="ชื่อลูกค้า (ไม่บังคับ)"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            value={customerPhone}
            onChange={(event) => props.onCustomerPhone(event.target.value)}
            placeholder="เบอร์โทร (ไม่บังคับ)"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      )}
      <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {cart.map((item) => (
          <div key={item.lineId} className="border-b border-gray-100 pb-3">
            <div className="flex justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-xs text-blue-600">
                  ฿{lineUnitPrice(item).toFixed(2)} / {saleUnit(item)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => props.onQuantity(item.lineId, -1)}
                  className="rounded-full bg-gray-100 p-1"
                >
                  <Minus size={13} />
                </button>
                <span className="text-sm">{item.qty}</span>
                <button
                  onClick={() => props.onQuantity(item.lineId, 1)}
                  className="rounded-full bg-gray-100 p-1"
                >
                  <Plus size={13} />
                </button>
                <button
                  onClick={() => props.onRemove(item.lineId)}
                  className="text-red-400"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
            {!!item.modifierGroups?.length && (
              <div className="mt-2 space-y-2">
                {item.modifierGroups.map((group) => (
                  <div key={group.id}>
                    <p className="mb-1 text-[11px] font-medium text-gray-400">
                      {group.name}
                      {group.required ? " *" : ""}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.options.map((modifier) => (
                        <button
                          key={modifier.id}
                          type="button"
                          onClick={() =>
                            props.onModifier(item.lineId, group, modifier.id)
                          }
                          className={`rounded-full border px-2.5 py-1 text-[11px] ${item.modifierIds.includes(modifier.id) ? "border-blue-200 bg-blue-50 text-blue-700" : "border-gray-100 bg-gray-50 text-gray-500"}`}
                        >
                          {modifier.name}
                          {modifier.price > 0
                            ? ` +฿${modifier.price.toFixed(0)}`
                            : ""}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <input
              value={item.note}
              onChange={(event) =>
                props.onItemNote(item.lineId, event.target.value)
              }
              placeholder="หมายเหตุ"
              className="mt-2 w-full rounded-lg bg-gray-50 px-3 py-1.5 text-xs outline-none"
            />
          </div>
        ))}
        {!cart.length && (
          <p className="mt-10 text-center text-sm text-gray-400">
            เลือกเมนูเพื่อเริ่มออเดอร์
          </p>
        )}
      </div>
      <textarea
        value={note}
        onChange={(event) => props.onNote(event.target.value)}
        placeholder="หมายเหตุรวม"
        rows={2}
        className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm outline-none"
      />
      <div className="mt-3 space-y-2 text-sm">
        {activeOrder && (
          <div className="flex justify-between">
            <span className="text-gray-400">ยอดเดิม</span>
            <span>฿{activeOrder.total.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-400">
            {activeOrder ? "รายการที่เพิ่ม" : "ยอดอาหาร"}
          </span>
          <span>฿{subtotal.toFixed(2)}</span>
        </div>
        {!activeOrder && (
          <div className="flex items-center justify-between">
            <span className="text-gray-400">ส่วนลด</span>
            <input
              type="number"
              min="0"
              max={subtotal}
              value={discount}
              onChange={(event) => props.onDiscount(event.target.value)}
              className="w-24 rounded-lg border px-2 py-1 text-right"
            />
          </div>
        )}
        <div className="flex justify-between border-t pt-2 text-lg font-semibold">
          <span>{activeOrder ? "รวมหลังเพิ่ม" : "รวม"}</span>
          <span className="text-blue-600">฿{combinedTotal.toFixed(2)}</span>
        </div>
      </div>
      {message && (
        <p
          className={`mt-2 text-xs ${message.includes("แล้ว") ? "text-emerald-600" : "text-red-500"}`}
        >
          {message}
        </p>
      )}
      <button
        onClick={props.onSubmit}
        disabled={loading || !cart.length}
        className="mt-3 w-full rounded-xl bg-[#356DDB] py-3 text-white disabled:opacity-50"
      >
        {loading
          ? "กำลังส่ง..."
          : orderType === "TAKEAWAY"
            ? "สร้างคิวและส่งเข้าครัว"
            : activeOrder
              ? "เพิ่มรายการเข้าบิลเดิม"
              : "ส่งออเดอร์เข้าครัว"}
      </button>
    </aside>
  );
}
