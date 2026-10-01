"use client";
import { useNotificationTarget } from "../../_hooks/useNotificationTarget";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Armchair, Eye, ReceiptText, Utensils, X } from "lucide-react";
import TableQr from "./TableQr";
import TableOrderDetailDrawer from "./TableOrderDetailDrawer";
import AddTableModal from "./AddTableModal";
import CancelOrderDialog from "./CancelOrderDialog";
import TablesHeader from "./TablesHeader";
import BillModal, { BillOrder, PromptPaySettings } from "../../_components/BillModal";
import type { ActiveOrder, RestaurantTable as Table, TableTab } from "../types";
import { itemStatusText, money, orderStatusClass, orderStatusText, statusClass, statusText, timeText } from "../utils";

export default function TablesPageClient() {
  const [tables, setTables] = useState<Table[]>([]);
  const [name, setName] = useState("");
  const [seats, setSeats] = useState("2");
  const [search, setSearch] = useState("");
  useNotificationTarget(() => { setSearch(""); setActiveTab("ALL"); });
  const [activeTab, setActiveTab] = useState<TableTab>("ALL");
  const [message, setMessage] = useState("");
  const [addingTable, setAddingTable] = useState(false);
  const [billOrder, setBillOrder] = useState<BillOrder | null>(null);
  const [detailOrder, setDetailOrder] = useState<ActiveOrder | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState<ActiveOrder | null>(null);
  const [paying, setPaying] = useState(false);
  const [promptPaySettings, setPromptPaySettings] = useState<PromptPaySettings | null>(null);

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
    fetch("/api/payment-settings")
      .then((response) => response.json())
      .then((data) => setPromptPaySettings(data))
      .catch(() => setPromptPaySettings(null));
  }, []);

  const summary = useMemo(() => ({
    total: tables.length,
    available: tables.filter((table) => table.status === "AVAILABLE").length,
    active: tables.filter((table) => table.orders[0]).length,
    ready: tables.filter((table) => ["READY", "SERVED"].includes(table.orders[0]?.status)).length,
  }), [tables]);
  const tableTabs = [
    { key: "ALL" as const, label: "ทั้งหมด", value: `${summary.total} โต๊ะ`, tone: "text-gray-900", activeClass: "border-blue-300 bg-blue-50 shadow-sm", hoverClass: "hover:border-blue-200 hover:bg-blue-50/40" },
    { key: "AVAILABLE" as const, label: "ว่าง", value: `${summary.available} โต๊ะ`, tone: "text-emerald-600", activeClass: "border-emerald-300 bg-emerald-50 shadow-sm", hoverClass: "hover:border-emerald-200 hover:bg-emerald-50/40" },
    { key: "ACTIVE" as const, label: "มีออเดอร์", value: `${summary.active} โต๊ะ`, tone: "text-blue-600", activeClass: "border-blue-300 bg-blue-50 shadow-sm", hoverClass: "hover:border-blue-200 hover:bg-blue-50/40" },
    { key: "READY" as const, label: "พร้อมเช็คบิล", value: `${summary.ready} โต๊ะ`, tone: "text-indigo-600", activeClass: "border-indigo-300 bg-indigo-50 shadow-sm", hoverClass: "hover:border-indigo-200 hover:bg-indigo-50/40" },
  ];
  const filteredTables = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tables.filter((table) => {
      const order = table.orders[0];
      const readyToBill = ["READY", "SERVED"].includes(order?.status);
      const matchesTab =
        activeTab === "ALL" ||
        (activeTab === "AVAILABLE" && table.status === "AVAILABLE") ||
        (activeTab === "ACTIVE" && Boolean(order)) ||
        (activeTab === "READY" && readyToBill);
      if (!matchesTab) return false;
      if (!query) return true;
      const searchable = [
        table.name,
        `${table.seats} ที่นั่ง`,
        statusText[table.status],
        order?.orderNumber,
        order ? orderStatusText[order.status] : "",
        readyToBill ? "พร้อมเช็คบิล" : "",
      ].filter(Boolean).join(" ").toLowerCase();
      return searchable.includes(query);
    });
  }, [activeTab, search, tables]);

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

  async function closeBill() {
    const table = tables.find(t => t.orders.some(o => o.id === billOrder?.id));
    if (table?.sessions?.length) {
      try {
        const res = await fetch("/api/table-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tableId: table.id, action: "clear-bill" }) });
        if (!res.ok) { setMessage("ยกเลิกเช็คบิลไม่สำเร็จ กรุณาลองใหม่"); return; }
      } catch { setMessage("เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่"); return; }
    }
    setBillOrder(null);
    load();
  }

  async function openBill(table: Table, order: ActiveOrder) {
    setMessage("");
    if (table.sessions?.length) {
      const res = await fetch("/api/table-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tableId: table.id, action: "pause" }) });
      if (!res.ok) { setMessage("พักรับรายการก่อนเช็คบิลไม่สำเร็จ กรุณาลองใหม่"); return; }
      const response = await fetch("/api/tables");
      if (!response.ok) { setMessage("โหลดยอดล่าสุดไม่สำเร็จ กรุณาลองใหม่"); return; }
      const latest = await response.json() as Table[];
      setTables(latest);
      const latestOrder = latest.find(t => t.id === table.id)?.orders[0];
      if (!latestOrder) { setMessage("บิลนี้ปิดไปแล้ว"); return; }
      order = latestOrder;
    }
    setBillOrder({ ...order, tableName: table.name });
  }

  function openDetail(table: Table, order: ActiveOrder) {
    setDetailOrder({ ...order, tableName: table.name });
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
      <TablesHeader search={search} tabs={tableTabs} activeTab={activeTab} onSearch={setSearch} onTab={setActiveTab} onAdd={() => setAddingTable(true)} />

      {message && <p className={`text-sm ${message.includes("แล้ว") ? "text-emerald-600" : "text-red-500"}`}>{message}</p>}

      <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filteredTables.map((table) => {
          const order = table.orders[0];
          const itemCount = order?.items.reduce((sum, item) => sum + item.qty, 0) || 0;
          const previewItems = order?.items.slice(0, 3) || [];
          return (
            <article id={`table-${table.id}`} key={table.id} className={`bg-white rounded-2xl border overflow-hidden ${order ? "border-blue-100 shadow-sm" : "border-gray-100"}`}>
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
                      <button data-notification-bill onClick={() => openBill(table, order)} className="bg-emerald-600 text-white rounded-xl py-2.5 text-sm flex items-center justify-center gap-2">
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
                    <div className="pt-4">
                      <button disabled={!!table.sessions?.length} onClick={() => status(table.id, table.status === "RESERVED" ? "AVAILABLE" : "RESERVED")} className="w-full bg-amber-50 text-amber-700 rounded-xl py-2.5 text-sm">{table.status === "RESERVED" ? "ยกเลิกจอง" : "จองโต๊ะ"}</button>
                    </div>
                  </div>
                )}
                <TableQr tableId={table.id} session={table.sessions?.[0]} hasOrder={!!order} reload={load} />
              </div>
            </article>
          );
        })}
      </div>

      {!filteredTables.length && <p className="text-center text-gray-400 mt-12">{tables.length ? "ไม่พบโต๊ะตามเงื่อนไขที่เลือก" : "เพิ่มโต๊ะเพื่อเริ่มรับออเดอร์"}</p>}

      {addingTable && <AddTableModal name={name} seats={seats} onName={setName} onSeats={setSeats} onClose={() => setAddingTable(false)} onSubmit={add} />}

      <BillModal
        order={billOrder}
        loading={paying}
        onClose={closeBill}
        onConfirm={pay}
        promptPaySettings={promptPaySettings}
      />

      {detailOrder && <TableOrderDetailDrawer order={detailOrder} onClose={() => setDetailOrder(null)} onCancel={() => setConfirmingCancel(detailOrder)} onBill={() => setBillOrder(detailOrder)} />}

      {confirmingCancel && <CancelOrderDialog order={confirmingCancel} onClose={() => setConfirmingCancel(null)} onConfirm={() => cancel(confirmingCancel.id)} />}
    </div>
  );
}
