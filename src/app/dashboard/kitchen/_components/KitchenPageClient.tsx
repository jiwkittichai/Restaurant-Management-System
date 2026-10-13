/**
 * KitchenPageClient ดูแลข้อมูลและการทำงานหลักของหน้างานภายในครัว
 * ใช้จัดการข้อมูลบนหน้าจอ ติดต่อ API และแจ้งผลสำเร็จหรือข้อผิดพลาดให้ผู้ใช้
 */

"use client";
import { useNotificationTarget } from "../../_hooks/useNotificationTarget";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChefHat, RefreshCw, Search } from "lucide-react";
import KitchenFilterCard from "./KitchenFilterCard";
import KitchenOrderCard from "./KitchenOrderCard";
import RecipeModal from "./RecipeModal";
import type { KitchenItem, KitchenOrder as Order, MonitorTab, RecipeLine, SelectedRecipe } from "../types";
import { itemText } from "../utils";
import LoadErrorMessage from "../../_components/LoadErrorMessage";
import { fetchJson } from "@/lib/client-fetch";

export default function KitchenPageClient() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  useNotificationTarget(() => { setSearch(""); setActiveTab("ALL"); });
  const [activeTab, setActiveTab] = useState<MonitorTab>("ALL");
  const [selectedRecipe, setSelectedRecipe] = useState<SelectedRecipe | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchJson("/api/orders");
      if (!Array.isArray(data)) throw new Error("รูปแบบข้อมูลออเดอร์ไม่ถูกต้อง");
      setOrders(data as Order[]);
      setLoadError("");
    } catch (loadFailure) {
      console.error("Failed to load kitchen orders", loadFailure);
      setLoadError("โหลดออเดอร์เข้าครัวไม่สำเร็จ ข้อมูลเดิมยังคงแสดงอยู่");
    }
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 10000);
    return () => clearInterval(timer);
  }, [load]);

  const monitor = useMemo(() => {
    const allItems = orders.flatMap((order) => order.items);
    return {
      ALL: orders.length,
      NEW: allItems.filter((item) => item.status === "NEW").length,
      PREPARING: allItems.filter((item) => item.status === "PREPARING").length,
      READY: allItems.filter((item) => item.status === "READY").length,
    };
  }, [orders]);
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const byStatus = activeTab === "ALL"
      ? orders
      : orders.map((order) => ({ ...order, items: order.items.filter((item) => item.status === activeTab) }))
        .filter((order) => order.items.length > 0);
    if (!query) return byStatus;
    return byStatus
      .map((order) => {
        const orderText = [
          order.orderNumber,
          order.queueNumber,
          order.customerName,
          order.table?.name,
          order.type === "TAKEAWAY" ? "ซื้อกลับบ้าน" : "ทานที่ร้าน",
        ].filter(Boolean).join(" ").toLowerCase();
        if (orderText.includes(query)) return order;
        return {
          ...order,
          items: order.items.filter((item) => {
          const searchable = [
            item.name,
            item.note,
            itemText[item.status],
            ...(item.modifiers?.map((modifier) => modifier.name) || []),
          ].filter(Boolean).join(" ").toLowerCase();
          return searchable.includes(query);
          }),
        };
      })
      .filter((order) => order.items.length > 0);
  }, [activeTab, orders, search]);
  const monitorCards = [
    { key: "ALL" as const, label: "ทั้งหมด", value: `${monitor.ALL} ออเดอร์`, tone: "text-gray-900", activeClass: "border-blue-300 bg-blue-50 shadow-sm", hoverClass: "hover:border-blue-200 hover:bg-blue-50/40" },
    { key: "NEW" as const, label: "รอครัวรับ", value: `${monitor.NEW} รายการ`, tone: "text-blue-600", activeClass: "border-blue-300 bg-blue-50 shadow-sm", hoverClass: "hover:border-blue-200 hover:bg-blue-50/40" },
    { key: "PREPARING" as const, label: "กำลังทำ", value: `${monitor.PREPARING} รายการ`, tone: "text-amber-700", activeClass: "border-amber-300 bg-amber-50 shadow-sm", hoverClass: "hover:border-amber-200 hover:bg-amber-50/50" },
    { key: "READY" as const, label: "พร้อมเสิร์ฟ", value: `${monitor.READY} รายการ`, tone: "text-emerald-600", activeClass: "border-emerald-300 bg-emerald-50 shadow-sm", hoverClass: "hover:border-emerald-200 hover:bg-emerald-50/40" },
  ];

  async function update(itemId: number, status: string) {
    const response = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "item-status", itemId, status }),
    });
    if (!response.ok) setError("อัปเดตสถานะไม่สำเร็จ");
    else load();
  }

  function recipeLines(item: KitchenItem): RecipeLine[] {
    const rows: RecipeLine[] = [];
    for (const recipe of item.menuItem?.recipes || []) {
      rows.push({
        key: `menu:${recipe.id}`,
        ingredientName: recipe.ingredient.name,
        unit: recipe.ingredient.unit,
        source: "สูตรเมนูหลัก",
        perUnitQuantity: recipe.quantity,
        totalQuantity: recipe.quantity * item.qty,
      });
    }
    for (const modifier of item.modifiers || []) for (const recipe of modifier.modifier?.recipes || []) {
      rows.push({
        key: `modifier:${modifier.id}:${recipe.id}`,
        ingredientName: recipe.ingredient.name,
        unit: recipe.ingredient.unit,
        source: modifier.name,
        perUnitQuantity: recipe.quantity,
        totalQuantity: recipe.quantity * item.qty,
      });
    }
    return rows;
  }

  function formatQuantity(value: number) {
    return value.toLocaleString("th-TH", { maximumFractionDigits: 2 });
  }

  return (
    <div className="space-y-5 overflow-y-auto p-4 sm:p-6">
      <section className="rounded-2xl border border-gray-100 bg-white px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900">มอนิเตอร์ครัว</h2>
            <p className="mt-0.5 text-sm text-gray-400">ติดตามออเดอร์ที่เข้าครัวและสถานะการทำอาหาร</p>
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
              placeholder="ค้นหาออเดอร์ โต๊ะ คิว หรือเมนู"
              className="h-full min-h-[58px] w-full rounded-xl border border-gray-100 bg-white pl-11 pr-4 text-sm font-medium text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:flex-[4]">
            {monitorCards.map((card) => (
              <KitchenFilterCard
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

      <LoadErrorMessage message={loadError} onRetry={load} />
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filteredOrders.map((order) => (
          <KitchenOrderCard
            key={order.id}
            order={order}
            onUpdate={update}
            onOpenRecipe={(selectedOrder, item) => setSelectedRecipe({ order: selectedOrder, item })}
          />
        ))}
      </div>

      {!filteredOrders.length && (
        <div className="mt-20 text-center text-gray-400">
          <ChefHat size={48} className="mx-auto mb-3 opacity-30" />
          <p>{orders.length ? "ยังไม่มีรายการในสถานะนี้" : "ยังไม่มีออเดอร์เข้าครัว"}</p>
        </div>
      )}

      {selectedRecipe && (
        <RecipeModal
          order={selectedRecipe.order}
          item={selectedRecipe.item}
          lines={recipeLines(selectedRecipe.item)}
          formatQuantity={formatQuantity}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
}
