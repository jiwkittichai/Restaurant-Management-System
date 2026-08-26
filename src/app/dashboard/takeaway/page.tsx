"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock3,
  Eye,
  PackageCheck,
  Phone,
  ReceiptText,
  RefreshCw,
  ShoppingBag,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import BillModal, { BillOrder } from "../components/BillModal";

type Item = { id: number; name: string; qty: number; price: number; note?: string | null; status?: string; modifiers?: Array<{ id: number; name: string; price: number }> };
type Order = BillOrder & {
  queueNumber: string;
  customerName?: string;
  customerPhone?: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
  items: Item[];
};

const statusText: Record<string, string> = {
  SENT: "รอครัว",
  PREPARING: "กำลังทำ",
  READY: "พร้อมรับ",
  SERVED: "รับแล้ว",
  CANCELLED: "ยกเลิก",
};

const itemStatusText: Record<string, string> = {
  NEW: "รอครัว",
  PREPARING: "กำลังทำ",
  READY: "พร้อม",
  SERVED: "ส่งแล้ว",
};

function money(value: number) {
  return `฿${value.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function timeText(value: string) {
  return new Date(value).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

function priority(order: Order) {
  if (order.status === "READY" && order.paymentStatus === "PAID") return 0;
  if (order.status === "READY") return 1;
  if (order.paymentStatus === "UNPAID") return 2;
  return 3;
}

function badgeClass(order: Order) {
  if (order.status === "READY" && order.paymentStatus === "PAID") return "bg-emerald-50 text-emerald-700";
  if (order.status === "READY") return "bg-blue-50 text-blue-700";
  if (order.status === "PREPARING") return "bg-amber-50 text-amber-700";
  return "bg-gray-100 text-gray-600";
}

export default function TakeawayPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [billOrder, setBillOrder] = useState<BillOrder | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState<Order | null>(null);
  const [promptPayGatewayEnabled, setPromptPayGatewayEnabled] = useState(false);

  const load = useCallback(() => fetch("/api/orders?view=takeaway").then((response) => response.json()).then(setOrders), []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    fetch("/api/payments/stripe/promptpay")
      .then((response) => response.json())
      .then((data) => setPromptPayGatewayEnabled(Boolean(data.enabled)))
      .catch(() => setPromptPayGatewayEnabled(false));
  }, []);

  const sortedOrders = useMemo(
    () => [...orders].sort((a, b) => priority(a) - priority(b) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [orders],
  );

  const summary = useMemo(() => ({
    total: orders.length,
    unpaid: orders.filter((order) => order.paymentStatus === "UNPAID").length,
    ready: orders.filter((order) => order.status === "READY").length,
    paid: orders.filter((order) => order.paymentStatus === "PAID").length,
  }), [orders]);

  async function action(orderId: number, actionName: string, extra: Record<string, unknown> = {}) {
    setLoadingId(orderId);
    setMessage("");
    const response = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action: actionName, ...extra }),
    });
    const data = await response.json();
    setLoadingId(null);
    if (!response.ok) return setMessage(data.error || "อัปเดตออเดอร์ไม่สำเร็จ");
    setMessage(actionName === "pay" ? "รับชำระเงินแล้ว" : actionName === "pickup" ? "ส่งมอบอาหารเรียบร้อยแล้ว" : "ยกเลิกออเดอร์และคืนสต็อกแล้ว");
    setDetailOrder(null);
    load();
  }

  async function pay(payload: { orderId: number; method: "CASH" | "PROMPTPAY"; receivedAmount: number; changeAmount: number }) {
    setLoadingId(payload.orderId);
    setMessage("");
    const response = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pay", ...payload }),
    });
    const data = await response.json();
    setLoadingId(null);
    if (!response.ok) throw new Error(data.error || "รับชำระเงินไม่สำเร็จ");
    setBillOrder(null);
    setDetailOrder(null);
    setMessage("รับชำระเงินแล้ว");
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

  async function cancel(order: Order) {
    await action(order.id, "cancel");
    setConfirmingCancel(null);
  }

  return (
    <div className="space-y-5 overflow-y-auto p-4 sm:p-6">
      <section className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">คิวซื้อกลับบ้าน</h2>
            <p className="mt-0.5 text-sm text-gray-400">ติดตามการชำระเงินและส่งมอบอาหารให้ลูกค้า</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <SummaryCard label="ทั้งหมด" value={`${summary.total} คิว`} />
              <SummaryCard label="ยังไม่ชำระ" value={`${summary.unpaid} คิว`} tone="text-red-500" />
              <SummaryCard label="พร้อมรับ" value={`${summary.ready} คิว`} tone="text-emerald-600" />
              <SummaryCard label="ชำระแล้ว" value={`${summary.paid} คิว`} tone="text-blue-600" />
            </div>
            <button onClick={load} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 text-sm font-medium text-gray-600 hover:bg-gray-200">
              <RefreshCw size={15} /> รีเฟรช
            </button>
          </div>
        </div>
      </section>

      {message && <p className={`text-sm ${message.includes("แล้ว") ? "text-emerald-600" : "text-red-500"}`}>{message}</p>}

      <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {sortedOrders.map((order) => {
          const preview = order.items.slice(0, 3);
          const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
          const readyToPickup = order.status === "READY" && order.paymentStatus === "PAID";

          return (
            <article key={order.id} className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                      <ShoppingBag size={22} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-xl font-semibold text-gray-900">{order.queueNumber}</h3>
                      <p className="truncate text-xs font-medium text-gray-400">{order.orderNumber}</p>
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
                    <button onClick={() => setDetailOrder(order)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-600 hover:bg-gray-50">
                      <Eye size={16} /> ดูรายการ
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                    {order.paymentStatus === "UNPAID" ? (
                      <button disabled={loadingId === order.id} onClick={() => setBillOrder(order)} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                        <ReceiptText size={17} /> เช็คบิล
                      </button>
                    ) : (
                      <button disabled={!readyToPickup || loadingId === order.id} onClick={() => action(order.id, "pickup")} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#356DDB] px-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400">
                        <PackageCheck size={17} /> {order.status === "READY" ? "ลูกค้ารับอาหารแล้ว" : "รอครัว"}
                      </button>
                    )}
                    {order.paymentStatus !== "PAID" && (
                      <button onClick={() => setConfirmingCancel(order)} className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100">
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
        })}
      </div>

      {!orders.length && (
        <div className="mt-20 text-center text-gray-400">
          <ShoppingBag size={52} className="mx-auto mb-3 opacity-25" />
          <p>ไม่มีคิวซื้อกลับบ้านที่กำลังดำเนินการ</p>
        </div>
      )}

      <BillModal
        order={billOrder}
        loading={loadingId === billOrder?.id}
        onClose={() => setBillOrder(null)}
        onConfirm={pay}
        onStripePromptPay={promptPayGatewayEnabled ? createStripePromptPay : undefined}
        onStripePromptPayStatus={promptPayGatewayEnabled ? checkStripePromptPay : undefined}
      />

      {detailOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
          <button type="button" aria-label="ปิดรายละเอียดคิว" className="hidden flex-1 cursor-default sm:block" onClick={() => setDetailOrder(null)} />
          <div className="h-full w-full overflow-y-auto bg-white p-5 shadow-2xl sm:max-w-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><PackageCheck size={22} /></div>
                <div>
                  <h2 className="font-semibold text-gray-900">รายละเอียดคิวซื้อกลับบ้าน</h2>
                  <p className="text-sm text-gray-400">{detailOrder.queueNumber} · {detailOrder.orderNumber}</p>
                </div>
              </div>
              <button type="button" onClick={() => setDetailOrder(null)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700"><X size={20} /></button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-100 px-4 py-3"><p className="text-xs text-gray-400">สถานะ</p><p className="mt-1 font-medium">{statusText[detailOrder.status] || detailOrder.status}</p></div>
              <div className="rounded-xl border border-gray-100 px-4 py-3"><p className="text-xs text-gray-400">สั่งเมื่อ</p><p className="mt-1 font-medium">{timeText(detailOrder.createdAt)}</p></div>
              <div className="rounded-xl border border-gray-100 px-4 py-3"><p className="text-xs text-gray-400">ยอดรวม</p><p className="mt-1 font-medium text-blue-600">{money(detailOrder.total)}</p></div>
            </div>
            <div className="mt-5 divide-y divide-gray-100 rounded-2xl border border-gray-100">
              {detailOrder.items.map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900"><span className="mr-2 text-blue-600">{item.qty}x</span>{item.name}</p>
                      <p className="mt-1 text-xs text-gray-400">{money(item.price)} / หน่วย</p>
                      {!!item.modifiers?.length && <p className="mt-1 text-xs text-blue-600">{item.modifiers.map((modifier) => `+ ${modifier.name}`).join(", ")}</p>}
                      {item.note && <p className="mt-1 text-xs text-red-500">หมายเหตุ: {item.note}</p>}
                    </div>
                    <div className="text-right">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500">{itemStatusText[item.status || ""] || item.status || "-"}</span>
                      <p className="mt-2 font-medium">{money(item.price * item.qty)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {confirmingCancel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="font-semibold text-gray-900">ยกเลิกคิวซื้อกลับบ้าน</h2>
            <p className="mt-2 text-sm text-gray-500">ต้องการยกเลิกคิว {confirmingCancel.queueNumber} ({confirmingCancel.orderNumber}) หรือไม่? วัตถุดิบของออเดอร์นี้จะถูกคืนเข้าสต็อก</p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmingCancel(null)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-600">ยกเลิก</button>
              <button onClick={() => cancel(confirmingCancel)} disabled={loadingId === confirmingCancel.id} className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-white disabled:opacity-50">{loadingId === confirmingCancel.id ? "กำลังยกเลิก..." : "ยกเลิกคิว"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, tone = "text-gray-900" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-[104px] rounded-xl border border-gray-100 px-3 py-2">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
