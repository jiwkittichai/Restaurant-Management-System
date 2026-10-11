"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, CircleDot, Filter, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import LoadErrorMessage from "../../_components/LoadErrorMessage";
import { fetchJson } from "@/lib/client-fetch";
import type { MenuItemListItem } from "../types";
import DeleteMenuItemDialog from "./DeleteMenuItemDialog";
import MenuItemTable from "./MenuItemTable";

type MenuStatusFilter = "ALL" | "READY" | "CLOSED" | "OUT_OF_STOCK";

export default function MenuPageClient() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItemListItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<MenuStatusFilter>("ALL");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [confirmingDelete, setConfirmingDelete] =
    useState<MenuItemListItem | null>(null);
  const load = useCallback(async () => {
    try {
      const data = await fetchJson("/api/menu");
      if (!Array.isArray(data)) throw new Error("รูปแบบข้อมูลเมนูไม่ถูกต้อง");
      setMenuItems(data as MenuItemListItem[]);
      setLoadError("");
    } catch (loadFailure) {
      console.error("Failed to load menu items", loadFailure);
      setLoadError("โหลดเมนูอาหารไม่สำเร็จ ข้อมูลเดิมยังคงแสดงอยู่");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(menuItem: MenuItemListItem) {
    await fetch("/api/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: menuItem.id,
        available: !menuItem.available,
      }),
    });
    void load();
  }
  async function remove(id: number) {
    const response = await fetch("/api/menu", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await response.json();
    if (!response.ok) setError(data.error);
    else {
      setConfirmingDelete(null);
      void load();
    }
  }
  const categories = useMemo(
    () => [...new Set(menuItems.map((menuItem) => menuItem.category.name))].sort((a, b) => a.localeCompare(b, "th")),
    [menuItems],
  );
  const filteredMenuItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return menuItems.filter((menuItem) => {
      const matchesSearch = `${menuItem.name} ${menuItem.sku} ${menuItem.category.name}`.toLowerCase().includes(query);
      const matchesCategory = categoryFilter === "ALL" || menuItem.category.name === categoryFilter;
      const matchesStatus = statusFilter === "ALL"
        || (statusFilter === "READY" && menuItem.available && menuItem.sellable)
        || (statusFilter === "CLOSED" && !menuItem.available)
        || (statusFilter === "OUT_OF_STOCK" && menuItem.available && menuItem.stockTracked && menuItem.maxServings === 0);
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [categoryFilter, menuItems, search, statusFilter]);
  const hasFilters = Boolean(search.trim() || categoryFilter !== "ALL" || statusFilter !== "ALL");

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-[minmax(260px,448px)_208px_192px]">
          <div className="relative min-w-0 min-[480px]:col-span-2 xl:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหาเมนู"
              className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-10 pr-4 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </div>
          <label className="relative min-w-0">
            <span className="sr-only">กรองตามหมวดหมู่</span>
            <Filter className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-100 bg-white py-3 pl-10 pr-8 text-sm text-gray-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            >
              <option value="ALL">ทุกหมวดหมู่</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </label>
          <label className="relative min-w-0">
            <span className="sr-only">กรองตามสถานะ</span>
            <CircleDot className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as MenuStatusFilter)}
              className="w-full appearance-none rounded-xl border border-gray-100 bg-white py-3 pl-10 pr-8 text-sm text-gray-700 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="READY">พร้อมขาย</option>
              <option value="CLOSED">ปิดขาย</option>
              <option value="OUT_OF_STOCK">วัตถุดิบไม่พอ</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </label>
        </div>
        <button
          onClick={() => router.push("/dashboard/menu/create")}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#356DDB] px-5 py-3 text-white"
        >
          <Plus size={18} /> เพิ่มเมนู
        </button>
      </div>
      {error && <p className="mb-3 text-red-500">{error}</p>}
      <div className="mb-3">
        <LoadErrorMessage message={loadError} onRetry={load} />
      </div>
      <MenuItemTable
        menuItems={filteredMenuItems}
        emptyMessage={hasFilters ? "ไม่พบเมนูตามคำค้นหาหรือตัวกรอง" : "ยังไม่มีเมนูอาหาร"}
        onEdit={(menuItem) =>
          router.push(`/dashboard/menu/${menuItem.id}/edit`)
        }
        onDelete={setConfirmingDelete}
        onToggle={toggle}
      />
      {confirmingDelete && (
        <DeleteMenuItemDialog
          menuItem={confirmingDelete}
          onClose={() => setConfirmingDelete(null)}
          onConfirm={() => remove(confirmingDelete.id)}
        />
      )}
    </div>
  );
}
