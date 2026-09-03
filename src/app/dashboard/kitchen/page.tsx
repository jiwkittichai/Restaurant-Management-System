"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpenText, ChefHat, Clock3, RefreshCw, Search, X } from "lucide-react";

type Ingredient = { id: number; name: string; unit: string };
type Recipe = { id: number; ingredientId: number; quantity: number; ingredient: Ingredient };
type Modifier = { id: number; name: string; price: number; modifier?: { recipes: Recipe[] } | null };
type Item = {
  id: number;
  name: string;
  qty: number;
  note?: string;
  status: string;
  menuItem?: { recipes: Recipe[] };
  modifiers?: Modifier[];
};
type Order = {
  id: number;
  orderNumber: string;
  type: string;
  queueNumber?: string;
  customerName?: string;
  paymentStatus: string;
  status: string;
  createdAt: string;
  table?: { name: string };
  items: Item[];
};
type MonitorTab = "ALL" | "NEW" | "PREPARING" | "READY";
type SelectedRecipe = { order: Order; item: Item };
type RecipeLine = { key: string; ingredientName: string; unit: string; source: string; perUnitQuantity: number; totalQuantity: number };

const itemText: Record<string, string> = { NEW: "รอทำ", PREPARING: "กำลังทำ", READY: "พร้อม", SERVED: "เสิร์ฟแล้ว" };
const itemBadgeClass: Record<string, string> = {
  NEW: "bg-gray-100 text-gray-500",
  PREPARING: "bg-amber-100 text-amber-700",
  READY: "bg-emerald-100 text-emerald-700",
  SERVED: "bg-blue-100 text-blue-700",
};

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<MonitorTab>("ALL");
  const [selectedRecipe, setSelectedRecipe] = useState<SelectedRecipe | null>(null);

  const load = useCallback(
    () => fetch("/api/orders").then((response) => response.json()).then(setOrders).catch(() => setError("โหลดออเดอร์ไม่สำเร็จ")),
    [],
  );

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

  function actionLabel(order: Order, item: Item) {
    if (item.status === "NEW") return "เริ่มทำ";
    if (item.status === "PREPARING") return order.type === "TAKEAWAY" ? "พร้อมรับ" : "พร้อมเสิร์ฟ";
    if (item.status === "READY" && order.type === "DINE_IN") return "เสิร์ฟแล้ว";
    return "";
  }

  function nextStatus(item: Item) {
    if (item.status === "NEW") return "PREPARING";
    if (item.status === "PREPARING") return "READY";
    if (item.status === "READY") return "SERVED";
    return "";
  }

  function recipeLines(item: Item): RecipeLine[] {
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

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filteredOrders.map((order) => (
          <article key={order.id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <header className={`px-4 py-3 text-white ${order.type === "TAKEAWAY" ? "bg-[#356DDB]" : "bg-[#212A3A]"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{order.type === "TAKEAWAY" ? `คิว ${order.queueNumber}` : order.table?.name}</p>
                  <p className="mt-0.5 truncate text-xs text-white/75">{order.customerName || order.orderNumber} · {order.paymentStatus === "PAID" ? "ชำระแล้ว" : "ยังไม่ชำระ"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs text-white/75">
                  <Clock3 size={14} />
                  {new Date(order.createdAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </header>

            <div className="divide-y divide-gray-100">
              {order.items.map((item) => {
                const label = actionLabel(order, item);
                const status = nextStatus(item);
                return (
                  <div key={item.id} className="px-4 py-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="shrink-0 text-sm font-semibold text-blue-600">{item.qty}x</span>
                          <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                        </div>
                        {!!item.modifiers?.length && <p className="mt-1 truncate text-xs text-blue-600">{item.modifiers.map((modifier) => `+ ${modifier.name}`).join(", ")}</p>}
                        {item.note && <p className="mt-1 truncate text-xs text-red-500">หมายเหตุ: {item.note}</p>}
                      </div>
                      <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                        <span className={`rounded-full px-2 py-1 text-[11px] ${itemBadgeClass[item.status] || "bg-gray-100 text-gray-500"}`}>
                          {itemText[item.status]}
                        </span>
                        <button
                          type="button"
                          title="ดูสูตรอาหาร"
                          aria-label={`ดูสูตรอาหาร ${item.name}`}
                          onClick={() => setSelectedRecipe({ order, item })}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-100 px-2.5 text-xs font-medium text-gray-600 transition hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <BookOpenText size={14} />
                          สูตร
                        </button>
                        {label && (
                          <button
                            onClick={() => update(item.id, status)}
                            className={`rounded-lg px-3 py-1.5 text-xs text-white ${
                              item.status === "NEW" ? "bg-amber-500" : item.status === "PREPARING" ? "bg-emerald-600" : "bg-blue-600"
                            }`}
                          >
                            {label}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
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

function RecipeModal({
  order,
  item,
  lines,
  formatQuantity,
  onClose,
}: {
  order: Order;
  item: Item;
  lines: RecipeLine[];
  formatQuantity: (value: number) => string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/25">
      <button type="button" aria-label="ปิดสูตรอาหาร" className="hidden flex-1 cursor-default sm:block" onClick={onClose} />
      <aside className="h-full w-full overflow-y-auto bg-white p-5 shadow-2xl sm:max-w-lg">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BookOpenText size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-semibold text-gray-900">สูตรอาหาร</h2>
              <p className="truncate text-sm text-gray-400">{item.qty}x {item.name}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="mt-4 grid gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-500">
          <div className="flex justify-between gap-3">
            <span>ออเดอร์</span>
            <span className="truncate font-medium text-gray-900">{order.type === "TAKEAWAY" ? `คิว ${order.queueNumber}` : order.table?.name}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>เลขที่</span>
            <span className="truncate font-medium text-gray-900">{order.orderNumber}</span>
          </div>
          {!!item.modifiers?.length && (
            <div className="flex justify-between gap-3">
              <span>ตัวเลือก</span>
              <span className="min-w-0 truncate font-medium text-blue-600">{item.modifiers.map((modifier) => modifier.name).join(", ")}</span>
            </div>
          )}
          {item.note && (
            <div className="flex justify-between gap-3">
              <span>หมายเหตุ</span>
              <span className="min-w-0 truncate font-medium text-red-500">{item.note}</span>
            </div>
          )}
        </div>

        <div className="mt-5">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">วัตถุดิบที่ต้องใช้</h3>
              <p className="mt-0.5 text-sm text-gray-400">ปริมาณรวมคำนวณตามจำนวน {item.qty} รายการ</p>
            </div>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-500">{lines.length} รายการ</span>
          </div>

          {lines.length ? (
            <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100">
              {lines.map((line) => (
                <div key={line.key} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{line.ingredientName}</p>
                    <p className="mt-1 truncate text-xs text-gray-400">{line.source} · {formatQuantity(line.perUnitQuantity)} {line.unit} ต่อรายการ</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">{formatQuantity(line.totalQuantity)}</p>
                    <p className="text-xs text-gray-400">{line.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
              เมนูนี้ยังไม่ได้ตั้งค่าสูตรอาหาร
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function KitchenFilterCard({
  active,
  label,
  value,
  tone,
  activeClass,
  hoverClass,
  onClick,
}: {
  active: boolean;
  label: string;
  value: string;
  tone: string;
  activeClass: string;
  hoverClass: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2 text-left transition ${hoverClass} ${
        active ? activeClass : "border-gray-100 bg-white"
      }`}
    >
      <p className="truncate text-xs text-gray-400">{label}</p>
      <p className={`font-semibold ${tone}`}>{value}</p>
    </button>
  );
}
