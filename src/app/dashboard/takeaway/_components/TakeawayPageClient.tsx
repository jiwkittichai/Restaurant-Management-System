"use client";
import { useNotificationTarget } from "../../_hooks/useNotificationTarget";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock3,
  Eye,
  PackageCheck,
  Phone,
  ReceiptText,
  RefreshCw,
  Search,
  ShoppingBag,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import BillModal, { BillOrder, PromptPaySettings } from "../../_components/BillModal";
import SummaryCard from "./SummaryCard";
import TakeawayOrderDetailDrawer from "./TakeawayOrderDetailDrawer";
import CancelTakeawayDialog from "./CancelTakeawayDialog";
import type { QueueTab, TakeawayOrder as Order } from "../types";
import { badgeClass, itemStatusText, money, priority, statusText, timeText } from "../utils";

export default function TakeawayPageClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [message, setMessage] = useState("");
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  useNotificationTarget(() => { setSearch(""); setActiveTab("ALL"); });
  const [activeTab, setActiveTab] = useState<QueueTab>("ALL");
  const [billOrder, setBillOrder] = useState<BillOrder | null>(null);
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState<Order | null>(null);
  const [promptPaySettings, setPromptPaySettings] = useState<PromptPaySettings | null>(null);

  const load = useCallback(() => fetch("/api/orders?view=takeaway").then((response) => response.json()).then(setOrders), []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    fetch("/api/payment-settings")
      .then((response) => response.json())
      .then((data) => setPromptPaySettings(data))
      .catch(() => setPromptPaySettings(null));
  }, []);

  const summary = useMemo(() => ({
    total: orders.length,
    unpaid: orders.filter((order) => order.paymentStatus === "UNPAID").length,
    ready: orders.filter((order) => order.status === "READY").length,
    paid: orders.filter((order) => order.paymentStatus === "PAID").length,
  }), [orders]);
  const filteredOrders = useMemo(() => {
    const visible = activeTab === "ALL"
      ? orders
      : orders.filter((order) => {
        if (activeTab === "UNPAID") return order.paymentStatus === "UNPAID";
        if (activeTab === "READY") return order.status === "READY";
        return order.paymentStatus === "PAID";
      });
    const query = search.trim().toLowerCase();
    const searched = query
      ? visible.filter((order) => {
        const searchable = [
          order.queueNumber,
          order.orderNumber,
          order.customerName,
          order.customerPhone,
          statusText[order.status],
          order.paymentStatus === "PAID" ? "ชำระแล้ว" : "ยังไม่ชำระ",
          ...order.items.flatMap((item) => [
            item.name,
            item.note,
            itemStatusText[item.status || ""],
            ...(item.modifiers?.map((modifier) => modifier.name) || []),
          ]),
        ].filter(Boolean).join(" ").toLowerCase();
        return searchable.includes(query);
      })
      : visible;
    return [...searched].sort((a, b) => priority(a) - priority(b) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [activeTab, orders, search]);
  const summaryCards = [
    { key: "ALL" as const, label: "ทั้งหมด", value: `${summary.total} คิว`, tone: "text-gray-900", activeClass: "border-blue-300 bg-blue-50 shadow-sm", hoverClass: "hover:border-blue-200 hover:bg-blue-50/40" },
    { key: "UNPAID" as const, label: "ยังไม่ชำระ", value: `${summary.unpaid} คิว`, tone: "text-red-500", activeClass: "border-red-300 bg-red-50 shadow-sm", hoverClass: "hover:border-red-200 hover:bg-red-50/40" },
    { key: "PAID" as const, label: "ชำระแล้ว", value: `${summary.paid} คิว`, tone: "text-blue-600", activeClass: "border-blue-300 bg-blue-50 shadow-sm", hoverClass: "hover:border-blue-200 hover:bg-blue-50/40" },
    { key: "READY" as const, label: "พร้อมรับ", value: `${summary.ready} คิว`, tone: "text-emerald-600", activeClass: "border-emerald-300 bg-emerald-50 shadow-sm", hoverClass: "hover:border-emerald-200 hover:bg-emerald-50/40" },
  ];

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

  async function cancel(order: Order) {
    await action(order.id, "cancel");
    setConfirmingCancel(null);
  }

  return (
    <div className="space-y-5 overflow-y-auto p-4 sm:p-6">
      <section className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900">คิวซื้อกลับบ้าน</h2>
            <p className="mt-0.5 text-sm text-gray-400">ติดตามการชำระเงินและส่งมอบอาหารให้ลูกค้า</p>
          </div>
          <button
            type="button"
            title="รีเฟรช"
            aria-label="รีเฟรช"
            onClick={load}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition hover:bg-gray-200"
          >
            <RefreshCw size={17} />
          </button>
        </div>
        <div className="mt-3 flex flex-col gap-2 xl:flex-row">
          <div className="relative xl:min-w-[260px] xl:flex-[1.35]">
            <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหาคิว เลขออเดอร์ ลูกค้า หรือเมนู"
              className="h-full min-h-[58px] w-full rounded-xl border border-gray-100 bg-white pl-11 pr-4 text-sm font-medium text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex-[4]">
            {summaryCards.map((card) => (
              <SummaryCard
                key={card.key}
                active={activeTab === card.key}
                label={card.label}
                value={card.value}
                tone={card.tone}
                activeClass={card.activeClass}
                hoverClass={card.hoverClass}
                onClick={() => setActiveTab(card.key)}
              />
            ))}
          </div>
        </div>
      </section>

      {message && <p className={`text-sm ${message.includes("แล้ว") ? "text-emerald-600" : "text-red-500"}`}>{message}</p>}

      <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filteredOrders.map((order) => {
          const preview = order.items.slice(0, 3);
          const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
          const readyToPickup = order.status === "READY" && order.paymentStatus === "PAID";

          return (
            <article id={`order-${order.id}`} key={order.id} className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
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

      {!filteredOrders.length && (
        <div className="mt-20 text-center text-gray-400">
          <ShoppingBag size={52} className="mx-auto mb-3 opacity-25" />
          <p>{orders.length ? "ไม่มีคิวตามเงื่อนไขที่เลือก" : "ไม่มีคิวซื้อกลับบ้านที่กำลังดำเนินการ"}</p>
        </div>
      )}

      <BillModal
        order={billOrder}
        loading={loadingId === billOrder?.id}
        onClose={() => setBillOrder(null)}
        onConfirm={pay}
        promptPaySettings={promptPaySettings}
      />

      {detailOrder && <TakeawayOrderDetailDrawer order={detailOrder} onClose={() => setDetailOrder(null)} />}

      {confirmingCancel && <CancelTakeawayDialog order={confirmingCancel} loading={loadingId === confirmingCancel.id} onClose={() => setConfirmingCancel(null)} onConfirm={() => cancel(confirmingCancel)} />}
    </div>
  );
}
