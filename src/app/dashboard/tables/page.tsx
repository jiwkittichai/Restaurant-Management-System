"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Armchair, Eye, Plus, ReceiptText, Utensils, X } from "lucide-react";
import BillModal, { BillOrder } from "../components/BillModal";

type ActiveOrder = BillOrder & { status: string; paymentStatus: string; createdAt?: string };
type Table = { id: number; name: string; seats: number; status: string; orders: ActiveOrder[] };

const statusText: Record<string, string> = { AVAILABLE: "ว่าง", OCCUPIED: "กำลังใช้งาน", RESERVED: "จอง", CLEANING: "รอทำความสะอาด" };
const statusClass: Record<string, string> = { AVAILABLE: "bg-emerald-100 text-emerald-700", OCCUPIED: "bg-red-100 text-red-700", RESERVED: "bg-amber-100 text-amber-700", CLEANING: "bg-gray-100 text-gray-600" };
const orderStatusText: Record<string, string> = { SENT: "ส่งครัวแล้ว", PREPARING: "กำลังทำ", READY: "พร้อมเสิร์ฟ", SERVED: "เสิร์ฟแล้ว" };
const orderStatusClass: Record<string, string> = { SENT: "bg-blue-50 text-blue-600", PREPARING: "bg-amber-50 text-amber-700", READY: "bg-emerald-50 text-emerald-700", SERVED: "bg-indigo-50 text-indigo-700" };
const itemStatusText: Record<string, string> = { NEW: "รอครัวรับ", PREPARING: "กำลังทำ", READY: "พร้อมแล้ว", SERVED: "เสิร์ฟแล้ว" };

function money(value: number) {
  return `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function timeText(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [name, setName] = useState("");
  const [seats, setSeats] = useState("2");
  const [message, setMessage] = useState("");
  const [addingTable, setAddingTable] = useState(false);
  const [billOrder, setBillOrder] = useState<BillOrder | null>(null);
  const [detailOrder, setDetailOrder] = useState<ActiveOrder | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState<ActiveOrder | null>(null);
  const [paying, setPaying] = useState(false);
  const [promptPayGatewayEnabled, setPromptPayGatewayEnabled] = useState(false);

  const load = useCallback(() => fetch("/api/tables").then((response) => response.json()).then(setTables), []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    window.addEventListener("focus", load);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [load]);

  useEffect(() => {
    fetch("/api/payments/stripe/promptpay")
      .then((response) => response.json())
      .then((data) => setPromptPayGatewayEnabled(Boolean(data.enabled)))
      .catch(() => setPromptPayGatewayEnabled(false));
  }, []);

  const summary = useMemo(() => ({
    total: tables.length,
    available: tables.filter((table) => table.status === "AVAILABLE").length,
    active: tables.filter((table) => table.orders[0]).length,
    ready: tables.filter((table) => ["READY", "SERVED"].includes(table.orders[0]?.status)).length,
    cleaning: tables.filter((table) => table.status === "CLEANING").length,
  }), [tables]);

  async function add(event: FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, seats }),
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error);
    setName("");
    setSeats("2");
    setAddingTable(false);
    setMessage("เพิ่มโต๊ะแล้ว");
    load();
  }

  async function status(id: number, nextStatus: string) {
    await fetch("/api/tables", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: nextStatus }),
    });
    load();
  }

  async function pay(payload: { orderId: number; method: string; receivedAmount: number; changeAmount: number }) {
    setPaying(true);
    const response = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pay", ...payload }),
    });
    const data = await response.json();
    setPaying(false);
    if (!response.ok) throw new Error(data.error || "รับชำระเงินไม่สำเร็จ");
    setBillOrder(null);
    setDetailOrder(null);
    setMessage("ชำระเงินและคืนสถานะโต๊ะว่างแล้ว");
    load();
  }

  async function createStripePromptPay(orderId: number) {
    const response = await fetch("/api/payments/stripe/promptpay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "สร้าง QR PromptPay ไม่สำเร็จ");
    return data as { paymentIntentId: string; status: string; qrCodeImageUrl: string; hostedInstructionsUrl?: string | null };
  }

  async function checkStripePromptPay(paymentIntentId: string) {
    const response = await fetch("/api/payments/stripe/promptpay", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "ตรวจสอบการชำระเงินไม่สำเร็จ");
    if (data.paid) {
      setDetailOrder(null);
      load();
    }
    return data as { paid: boolean; status: string };
  }

  async function cancel(orderId: number) {
    const response = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel", orderId }),
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error);
    setConfirmingCancel(null);
    setDetailOrder(null);
    setMessage("ยกเลิกออเดอร์และคืนสต็อกแล้ว");
    load();
  }

  function openBill(table: Table, order: ActiveOrder) {
    setMessage("");
    setBillOrder({ ...order, tableName: table.name });
  }

  function openDetail(table: Table, order: ActiveOrder) {
    setDetailOrder({ ...order, tableName: table.name });
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
      <section className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">ภาพรวมโต๊ะอาหาร</h2>
            <p className="mt-0.5 text-sm text-gray-400">ดูสถานะโต๊ะ ออเดอร์ในครัว และยอดบิลได้จากหน้านี้</p>
          </div>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:flex">
              <div className="rounded-xl border border-gray-100 px-3 py-2"><p className="text-xs text-gray-400">ทั้งหมด</p><p className="font-semibold">{summary.total} โต๊ะ</p></div>
              <div className="rounded-xl border border-gray-100 px-3 py-2"><p className="text-xs text-gray-400">ว่าง</p><p className="font-semibold text-emerald-600">{summary.available} โต๊ะ</p></div>
              <div className="rounded-xl border border-gray-100 px-3 py-2"><p className="text-xs text-gray-400">มีออเดอร์</p><p className="font-semibold text-blue-600">{summary.active} โต๊ะ</p></div>
              <div className="rounded-xl border border-gray-100 px-3 py-2"><p className="text-xs text-gray-400">พร้อมเช็คบิล</p><p className="font-semibold text-indigo-600">{summary.ready} โต๊ะ</p></div>
              <div className="rounded-xl border border-gray-100 px-3 py-2"><p className="text-xs text-gray-400">ทำความสะอาด</p><p className="font-semibold text-gray-500">{summary.cleaning} โต๊ะ</p></div>
            </div>
            <button onClick={() => setAddingTable(true)} className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-[#356DDB] px-4 py-3 text-white xl:h-[58px]">
              <Plus size={17} /> เพิ่มโต๊ะ
            </button>
          </div>
        </div>
      </section>

      {message && <p className={`text-sm ${message.includes("แล้ว") ? "text-emerald-600" : "text-red-500"}`}>{message}</p>}

      <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {tables.map((table) => {
          const order = table.orders[0];
          const itemCount = order?.items.reduce((sum, item) => sum + item.qty, 0) || 0;
          const previewItems = order?.items.slice(0, 3) || [];
          return (
            <article key={table.id} className={`bg-white rounded-2xl border overflow-hidden ${order ? "border-blue-100 shadow-sm" : "border-gray-100"}`}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl grid place-items-center ${order ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"}`}><Armchair size={22} /></div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{table.name}</h3>
                      <p className="text-sm text-gray-400">{table.seats} ที่นั่ง</p>
                    </div>
                  </div>
                  <span className={`shrink-0 px-3 py-1 rounded-full text-xs ${statusClass[table.status]}`}>{statusText[table.status]}</span>
                </div>

                {order ? (
                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl bg-gray-50 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="min-w-0 truncate text-xs font-medium text-gray-400">{order.orderNumber}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs ${orderStatusClass[order.status] || "bg-gray-100 text-gray-500"}`}>{orderStatusText[order.status] || order.status}</span>
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
                          <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">{itemStatusText[item.status || ""] || item.status}</span>
                        </div>
                      ))}
                      {order.items.length > 3 && <p className="text-xs text-gray-400">+ อีก {order.items.length - 3} รายการ</p>}
                    </div>

                    <div className="flex items-end justify-between border-t border-gray-100 pt-3">
                      <div>
                        <p className="text-xs text-gray-400">ยอดบิล</p>
                        <p className="text-xl font-semibold text-gray-900">{money(order.total)}</p>
                      </div>
                      <button onClick={() => openDetail(table, order)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 flex items-center gap-2">
                        <Eye size={16} /> ดูรายการ
                      </button>
                    </div>

                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <button onClick={() => openBill(table, order)} className="bg-emerald-600 text-white rounded-xl py-2.5 text-sm flex items-center justify-center gap-2">
                        <ReceiptText size={16} /> เช็คบิล
                      </button>
                      <button onClick={() => setConfirmingCancel(order)} className="rounded-xl bg-red-50 px-3 text-red-500"><X size={18} /></button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 p-4 text-center">
                      <Utensils className="text-gray-300" size={24} />
                      <p className="mt-2 text-sm text-gray-400">ยังไม่มีออเดอร์</p>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <button onClick={() => status(table.id, table.status === "RESERVED" ? "AVAILABLE" : "RESERVED")} className="flex-1 bg-amber-50 text-amber-700 rounded-xl py-2.5 text-sm">{table.status === "RESERVED" ? "ยกเลิกจอง" : "จองโต๊ะ"}</button>
                      <button onClick={() => status(table.id, table.status === "CLEANING" ? "AVAILABLE" : "CLEANING")} className="flex-1 bg-gray-100 text-gray-600 rounded-xl py-2.5 text-sm">{table.status === "CLEANING" ? "ทำความสะอาดแล้ว" : "รอทำความสะอาด"}</button>
                    </div>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {!tables.length && <p className="text-center text-gray-400 mt-12">เพิ่มโต๊ะเพื่อเริ่มรับออเดอร์</p>}

      {addingTable && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
          <form onSubmit={add} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Armchair size={22} /></div>
                <div>
                  <h2 className="font-semibold text-gray-900">เพิ่มโต๊ะอาหาร</h2>
                  <p className="mt-1 text-sm text-gray-400">กำหนดชื่อโต๊ะและจำนวนที่นั่งสำหรับหน้าร้าน</p>
                </div>
              </div>
              <button type="button" onClick={() => setAddingTable(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block"><span className="text-sm font-medium text-gray-700">ชื่อโต๊ะ</span><input required autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="เช่น A1, โต๊ะ 1" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400" /></label>
              <label className="block"><span className="text-sm font-medium text-gray-700">จำนวนที่นั่ง</span><input required type="number" min="1" value={seats} onChange={(event) => setSeats(event.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400" /></label>
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setAddingTable(false)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-600">ยกเลิก</button>
              <button className="flex-1 rounded-xl bg-[#356DDB] px-4 py-3 text-white"><span className="inline-flex items-center justify-center gap-2"><Plus size={17} />เพิ่มโต๊ะ</span></button>
            </div>
          </form>
        </div>
      )}

      <BillModal
        order={billOrder}
        loading={paying}
        onClose={() => setBillOrder(null)}
        onConfirm={pay}
        onStripePromptPay={promptPayGatewayEnabled ? createStripePromptPay : undefined}
        onStripePromptPayStatus={promptPayGatewayEnabled ? checkStripePromptPay : undefined}
      />

      {detailOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
          <button type="button" aria-label="ปิดรายละเอียดออเดอร์" className="hidden flex-1 cursor-default sm:block" onClick={() => setDetailOrder(null)} />
          <div className="h-full w-full overflow-y-auto bg-white p-5 shadow-2xl sm:max-w-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><ReceiptText size={22} /></div><div><h2 className="font-semibold text-gray-900">รายละเอียดออเดอร์</h2><p className="text-sm text-gray-400">{detailOrder.orderNumber} · {detailOrder.tableName}</p></div></div>
              <button type="button" onClick={() => setDetailOrder(null)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 px-4 py-3"><p className="text-xs text-gray-400">สถานะครัว</p><p className="mt-1 font-medium">{orderStatusText[detailOrder.status] || detailOrder.status}</p></div>
              <div className="rounded-xl border border-gray-100 px-4 py-3"><p className="text-xs text-gray-400">เปิดโต๊ะ</p><p className="mt-1 font-medium">{timeText(detailOrder.createdAt)}</p></div>
              <div className="rounded-xl border border-gray-100 px-4 py-3"><p className="text-xs text-gray-400">ยอดบิล</p><p className="mt-1 font-medium text-blue-600">{money(detailOrder.total)}</p></div>
            </div>
            <div className="mt-5 divide-y divide-gray-100 rounded-2xl border border-gray-100">
              {detailOrder.items.map((item) => <div key={item.id} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-medium text-gray-900"><span className="mr-2 text-blue-600">{item.qty}x</span>{item.name}</p><p className="mt-1 text-xs text-gray-400">{money(item.price)} / หน่วย</p>{item.note && <p className="mt-1 text-xs text-red-500">หมายเหตุ: {item.note}</p>}</div><div className="text-right"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">{itemStatusText[item.status || ""] || item.status}</span><p className="mt-2 font-medium">{money(item.price * item.qty)}</p></div></div></div>)}
            </div>
            <div className="sticky bottom-0 -mx-5 mt-6 border-t border-gray-100 bg-white p-5"><div className="flex gap-2"><button onClick={() => setConfirmingCancel(detailOrder)} className="flex-1 rounded-xl bg-red-50 px-4 py-3 text-red-500">ยกเลิกออเดอร์</button><button onClick={() => setBillOrder(detailOrder)} className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-white">เช็คบิล</button></div></div>
          </div>
        </div>
      )}

      {confirmingCancel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="font-semibold text-gray-900">ยกเลิกออเดอร์</h2>
            <p className="mt-2 text-sm text-gray-500">ต้องการยกเลิก {confirmingCancel.orderNumber} หรือไม่? วัตถุดิบของออเดอร์นี้จะถูกคืนเข้าสต็อก</p>
            <div className="mt-5 flex gap-2"><button onClick={() => setConfirmingCancel(null)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-600">ยกเลิก</button><button onClick={() => cancel(confirmingCancel.id)} className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-white">ยกเลิกออเดอร์</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
