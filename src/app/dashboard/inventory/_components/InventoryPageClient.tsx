/**
 * InventoryPageClient ดูแลข้อมูลและการทำงานหลักของหน้าวัตถุดิบและสต็อก
 * ใช้จัดการข้อมูลบนหน้าจอ ติดต่อ API และแจ้งผลสำเร็จหรือข้อผิดพลาดให้ผู้ใช้
 */

"use client";
import { useNotificationTarget } from "../../_hooks/useNotificationTarget";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AddIngredientModal from "./AddIngredientModal";
import DeleteIngredientDialog from "./DeleteIngredientDialog";
import IngredientCard from "./IngredientCard";
import InventoryHeader from "./InventoryHeader";
import type { EditForm, Ingredient, IngredientForm, StockFilter } from "../types";
import LoadErrorMessage from "../../_components/LoadErrorMessage";
import { fetchJson } from "@/lib/client-fetch";

export default function InventoryPageClient() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [form, setForm] = useState<IngredientForm>({ name: "", unit: "กรัม", stock: "", minStock: "" });
  const [addingIngredient, setAddingIngredient] = useState(false);
  const [search, setSearch] = useState("");
  useNotificationTarget(() => { setSearch(""); setStockFilter("ALL"); });
  const [stockFilter, setStockFilter] = useState<StockFilter>("ALL");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState<Ingredient | null>(null);
  const [saving, setSaving] = useState(false);
  const [receive, setReceive] = useState<Record<number, string>>({});
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await fetchJson("/api/inventory");
      if (!Array.isArray(data)) throw new Error("รูปแบบข้อมูลสต็อกไม่ถูกต้อง");
      setIngredients(data as Ingredient[]);
      setLoadError("");
    } catch (loadFailure) {
      console.error("Failed to load inventory", loadFailure);
      setLoadError("โหลดข้อมูลสต็อกไม่สำเร็จ ข้อมูลเดิมยังคงแสดงอยู่");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function add(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setSaving(true);
    const response = await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(data.error);
    setForm({ name: "", unit: "กรัม", stock: "", minStock: "" });
    setAddingIngredient(false);
    setMessage("เพิ่มวัตถุดิบแล้ว");
    load();
  }

  function closeAdd() {
    setAddingIngredient(false);
    setForm({ name: "", unit: "กรัม", stock: "", minStock: "" });
  }

  async function stockIn(id: number) {
    const quantity = Number(receive[id]);
    if (!(quantity > 0)) return;
    const response = await fetch("/api/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "stock-in", id, quantity }) });
    if (response.ok) {
      setReceive({ ...receive, [id]: "" });
      setMessage("รับวัตถุดิบเข้าสต็อกแล้ว");
      load();
    }
  }

  function startEdit(item: Ingredient) {
    setEditingId(item.id);
    setEditForm({ name: item.name, unit: item.unit, stock: String(item.stock), minStock: String(item.minStock) });
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(null);
  }

  async function updateIngredient(id: number) {
    if (!editForm) return;
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/inventory", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...editForm }) });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(data.error || "แก้ไขวัตถุดิบไม่สำเร็จ");
    cancelEdit();
    setMessage("แก้ไขวัตถุดิบแล้ว");
    load();
  }

  async function remove(id: number) {
    const response = await fetch("/api/inventory", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await response.json();
    if (!response.ok) setMessage(data.error);
    else {
      setConfirmingDelete(null);
      load();
    }
  }

  const lowStockCount = ingredients.filter((item) => item.stock <= item.minStock).length;
  const filteredIngredients = ingredients.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.trim().toLowerCase());
    const low = item.stock <= item.minStock;
    if (stockFilter === "LOW") return matchesSearch && low;
    if (stockFilter === "READY") return matchesSearch && !low;
    return matchesSearch;
  });

  return (
    <div className="space-y-6 overflow-y-auto p-4 sm:p-6">
      <InventoryHeader
        search={search}
        activeFilter={stockFilter}
        totalCount={ingredients.length}
        lowStockCount={lowStockCount}
        onSearch={setSearch}
        onFilter={setStockFilter}
        onAdd={() => {
          setAddingIngredient(true);
          setMessage("");
        }}
      />

      {message && <p className={`text-sm ${message.includes("แล้ว") ? "text-emerald-600" : "text-red-500"}`}>{message}</p>}
      <LoadErrorMessage message={loadError} onRetry={load} />

      <section>
        <div className="mb-3">
          <div>
            <h2 className="font-semibold">คงเหลือในสต็อก</h2>
            <p className="mt-1 text-sm text-gray-400">ค้นหา กรอง และรับวัตถุดิบเข้าสต็อกจากรายการนี้</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredIngredients.map((item) => (
            <IngredientCard
              key={item.id}
              item={item}
              editForm={editingId === item.id ? editForm : null}
              receiveQuantity={receive[item.id] || ""}
              saving={saving}
              onStartEdit={startEdit}
              onCancelEdit={cancelEdit}
              onEditForm={setEditForm}
              onSave={updateIngredient}
              onDelete={setConfirmingDelete}
              onReceiveQuantity={(value) => setReceive({ ...receive, [item.id]: value })}
              onStockIn={stockIn}
            />
          ))}
          {!filteredIngredients.length && <p className="text-sm text-gray-400">ไม่พบวัตถุดิบตามเงื่อนไขที่เลือก</p>}
        </div>
      </section>

      {addingIngredient && <AddIngredientModal form={form} saving={saving} onForm={setForm} onClose={closeAdd} onSubmit={add} />}

      {confirmingDelete && (
        <DeleteIngredientDialog
          ingredient={confirmingDelete}
          onClose={() => setConfirmingDelete(null)}
          onConfirm={() => remove(confirmingDelete.id)}
        />
      )}
    </div>
  );
}
