"use client";
import { useNotificationTarget } from "../../_hooks/useNotificationTarget";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import TableOrderDetailDrawer from "./TableOrderDetailDrawer";
import AddTableModal from "./AddTableModal";
import CancelOrderDialog from "./CancelOrderDialog";
import TablesHeader from "./TablesHeader";
import TableCard from "./TableCard";
import BillModal, { BillOrder, PromptPaySettings } from "../../_components/billing/BillModal";
import type { ActiveOrder, RestaurantTable as Table, TableTab } from "../types";
import { orderStatusText, statusText } from "../utils";

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
        {filteredTables.map((table) => (
          <TableCard
            key={table.id}
            table={table}
            onReload={load}
            onStatusChange={status}
            onOpenDetail={openDetail}
            onOpenBill={openBill}
            onCancel={setConfirmingCancel}
          />
        ))}
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
