import { BellRing, ChefHat } from "lucide-react";
import type { GuestOrderData, GuestTab } from "../types";
import { guestItemStatusText, guestMoney } from "../utils";

type Props = {
  order: GuestOrderData["order"];
  tab: Exclude<GuestTab, "menu">;
  billRequested: boolean;
  busy: boolean;
  onRequestBill: () => void;
};

export default function GuestSubmittedOrders({
  order,
  tab,
  billRequested,
  busy,
  onRequestBill,
}: Props) {
  const items = (order?.items || []).filter(
    (item) => tab === "table" || item.mine,
  );
  const mineTotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <>
      <div className="rounded-2xl bg-slate-900 p-5 text-white">
        <p className="text-sm text-slate-300">
          {tab === "mine"
            ? "ยอดรายการจากเครื่องนี้ (ก่อนส่วนลด)"
            : "ยอดรวมทั้งโต๊ะ"}
        </p>
        <p className="mt-2 text-3xl font-semibold">
          {guestMoney(tab === "mine" ? mineTotal : order?.total || 0)}
        </p>
        <p className="mt-2 text-xs text-slate-300">
          รวมชำระเป็นบิลเดียว · ต้องการยกเลิกรายการ กรุณาติดต่อพนักงาน
        </p>
      </div>

      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-2xl border border-slate-100 bg-white p-4"
        >
          <div className="flex justify-between gap-3">
            <h2 className="font-medium">
              {item.qty} × {item.name}
            </h2>
            <span>{guestMoney(item.qty * item.price)}</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {item.modifiers.map((modifier) => modifier.name).join(" · ")}
            {item.note ? ` · ${item.note}` : ""}
          </p>
          <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
            <ChefHat size={14} />
            {guestItemStatusText[item.status] || item.status}
          </span>
        </article>
      ))}

      {!items.length && (
        <p className="py-8 text-center text-slate-500">ยังไม่มีรายการที่ส่ง</p>
      )}

      {tab === "table" && !!order?.items.length && (
        <button
          disabled={busy || billRequested}
          onClick={onRequestBill}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white p-4 text-blue-700 disabled:opacity-50"
        >
          <BellRing size={18} />
          {billRequested ? "แจ้งเรียกเก็บเงินแล้ว" : "เรียกเก็บเงินทั้งโต๊ะ"}
        </button>
      )}
    </>
  );
}
