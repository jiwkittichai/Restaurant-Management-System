/**
 * OrdersPageClient ดูแลข้อมูลและการทำงานหลักของหน้าการรับออเดอร์
 * ใช้จัดการข้อมูลบนหน้าจอ ติดต่อ API และแจ้งผลสำเร็จหรือข้อผิดพลาดให้ผู้ใช้
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import LoadErrorMessage from "../../_components/LoadErrorMessage";
import { fetchJson } from "@/lib/client-fetch";
import type {
  CartItem,
  Category,
  MenuItem,
  ModifierGroup,
  OrderType,
  RestaurantTable,
} from "../types";
import { lineUnitPrice, saleUnit } from "../utils";
import MenuCatalog from "./MenuCatalog";
import OrderCart from "./OrderCart";

export default function OrdersPageClient() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState<number | "all">("all");
  const [orderType, setOrderType] = useState<OrderType>("DINE_IN");
  const [tableId, setTableId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [search, setSearch] = useState("");
  const [discount, setDiscount] = useState("0");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    try {
      const [menuData, categoryData, tableData] = await Promise.all([
        fetchJson("/api/menu"),
        fetchJson("/api/categories"),
        fetchJson("/api/tables"),
      ]);
      if (
        !Array.isArray(menuData) ||
        !Array.isArray(categoryData) ||
        !Array.isArray(tableData)
      )
        throw new Error("รูปแบบข้อมูลหน้ารับออเดอร์ไม่ถูกต้อง");
      setMenu(menuData as MenuItem[]);
      setCategories(categoryData as Category[]);
      setTables(tableData as RestaurantTable[]);
      setLoadError("");
    } catch (loadFailure) {
      console.error("Failed to load order form data", loadFailure);
      setLoadError(
        "โหลดข้อมูลสำหรับรับออเดอร์ไม่สำเร็จ ข้อมูลเดิมยังคงแสดงอยู่",
      );
    }
  }, []);
  useEffect(() => {
    void load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  const selectedTable = tables.find((table) => table.id === Number(tableId));
  const activeOrder = selectedTable?.orders[0];
  const subtotal = cart.reduce(
    (sum, item) => sum + lineUnitPrice(item) * item.qty,
    0,
  );
  const total = Math.max(0, subtotal - Number(discount || 0));
  const combinedTotal = activeOrder ? activeOrder.total + subtotal : total;

  function add(item: MenuItem) {
    if (!item.sellable) return;
    const found = cart.find(
      (cartItem) => cartItem.id === item.id && !cartItem.modifierIds.length,
    );
    if (found && item.maxServings !== null && found.qty >= item.maxServings) {
      setMessage(
        `${item.name} เหลือขายได้ ${item.maxServings} ${saleUnit(item)}`,
      );
      return;
    }
    setCart((current) =>
      found
        ? current.map((cartItem) =>
            cartItem.lineId === found.lineId
              ? { ...cartItem, qty: cartItem.qty + 1 }
              : cartItem,
          )
        : [
            ...current,
            {
              ...item,
              lineId: `${item.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
              qty: 1,
              note: "",
              modifierIds: [],
            },
          ],
    );
  }
  function quantity(lineId: string, delta: number) {
    const item = cart.find((cartItem) => cartItem.lineId === lineId);
    if (
      item &&
      delta > 0 &&
      item.maxServings !== null &&
      item.qty + delta > item.maxServings
    ) {
      setMessage(
        `${item.name} เหลือขายได้ ${item.maxServings} ${saleUnit(item)}`,
      );
      return;
    }
    setCart((current) =>
      current
        .map((cartItem) =>
          cartItem.lineId === lineId
            ? { ...cartItem, qty: cartItem.qty + delta }
            : cartItem,
        )
        .filter((cartItem) => cartItem.qty > 0),
    );
  }
  function toggleModifier(
    lineId: string,
    group: ModifierGroup,
    modifierId: number,
  ) {
    setCart((current) =>
      current.map((item) => {
        if (item.lineId !== lineId) return item;
        const groupOptionIds = group.options.map((option) => option.id);
        const selectedInGroup = item.modifierIds.filter((id) =>
          groupOptionIds.includes(id),
        );
        if (item.modifierIds.includes(modifierId))
          return {
            ...item,
            modifierIds: item.modifierIds.filter((id) => id !== modifierId),
          };
        const withoutGroup =
          group.maxSelect === 1
            ? item.modifierIds.filter((id) => !groupOptionIds.includes(id))
            : item.modifierIds;
        if (group.maxSelect > 1 && selectedInGroup.length >= group.maxSelect) {
          setMessage(
            `เลือก ${group.name} ได้ไม่เกิน ${group.maxSelect} รายการ`,
          );
          return item;
        }
        return { ...item, modifierIds: [...withoutGroup, modifierId] };
      }),
    );
  }
  function changeType(type: OrderType) {
    setOrderType(type);
    setMessage("");
    if (type === "TAKEAWAY") setTableId("");
  }

  async function submit() {
    if (!cart.length) return setMessage("กรุณาเลือกเมนูอาหาร");
    if (orderType === "DINE_IN" && !tableId)
      return setMessage("กรุณาเลือกโต๊ะอาหาร");
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: orderType,
        tableId: orderType === "DINE_IN" ? Number(tableId) : undefined,
        customerName,
        customerPhone,
        items: cart.map((item) => ({
          menuItemId: item.id,
          qty: item.qty,
          note: item.note,
          modifierIds: item.modifierIds,
        })),
        discount: activeOrder ? 0 : Number(discount || 0),
        note,
      }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) return setMessage(data.error);
    setMessage(
      orderType === "TAKEAWAY"
        ? `สร้างคิว ${data.queueNumber} และส่งเข้าครัวแล้ว`
        : data.isAdditional
          ? `เพิ่มรายการในบิล ${data.orderNumber} แล้ว`
          : `ส่งออเดอร์ ${data.orderNumber} เข้าครัวแล้ว`,
    );
    setCart([]);
    setTableId("");
    setCustomerName("");
    setCustomerPhone("");
    setDiscount("0");
    setNote("");
    void load();
  }

  return (
    <div className="grid gap-5 overflow-y-auto p-4 lg:p-6 xl:h-[calc(100dvh-96px)] xl:min-h-0 xl:grid-cols-[minmax(0,1fr)_380px] xl:overflow-hidden">
      <div className="min-h-0 overflow-y-auto pr-1">
        <div className="mb-4">
          <LoadErrorMessage message={loadError} onRetry={load} />
        </div>
        <MenuCatalog
          menu={menu}
          categories={categories}
          category={category}
          search={search}
          onSearch={setSearch}
          onCategory={setCategory}
          onAdd={add}
        />
      </div>
      <OrderCart
        cart={cart}
        tables={tables}
        activeOrder={activeOrder}
        orderType={orderType}
        tableId={tableId}
        customerName={customerName}
        customerPhone={customerPhone}
        discount={discount}
        note={note}
        message={message}
        loading={loading}
        subtotal={subtotal}
        combinedTotal={combinedTotal}
        onOrderType={changeType}
        onTableId={(value) => {
          setTableId(value);
          setMessage("");
        }}
        onCustomerName={setCustomerName}
        onCustomerPhone={setCustomerPhone}
        onDiscount={setDiscount}
        onNote={setNote}
        onItemNote={(lineId, value) =>
          setCart((current) =>
            current.map((item) =>
              item.lineId === lineId ? { ...item, note: value } : item,
            ),
          )
        }
        onQuantity={quantity}
        onModifier={toggleModifier}
        onRemove={(lineId) =>
          setCart((current) => current.filter((item) => item.lineId !== lineId))
        }
        onSubmit={submit}
      />
    </div>
  );
}
