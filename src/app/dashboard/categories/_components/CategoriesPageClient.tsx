"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { Category } from "../types";
import AddCategoryModal from "./AddCategoryModal";
import CategoryCard from "./CategoryCard";

export default function CategoriesPageClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const load = useCallback(() => fetch("/api/categories").then((response) => response.json()).then(setCategories), []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const response = await fetch("/api/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setError(data.error);
    setName("");
    setAddingCategory(false);
    load();
  }

  function closeAdd() {
    setAddingCategory(false);
    setName("");
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
  }

  async function update(id: number) {
    setError("");
    setSaving(true);
    const response = await fetch("/api/categories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, name: editName }) });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setError(data.error);
    cancelEdit();
    load();
  }

  async function remove(id: number) {
    const response = await fetch("/api/categories", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const data = await response.json();
    if (!response.ok) return setError(data.error);
    load();
  }

  const filteredCategories = categories.filter((category) => category.name.toLowerCase().includes(search.trim().toLowerCase()));

  return (
    <div className="p-6">
      <section className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 sm:flex-row">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาหมวดหมู่" className="flex-1 rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400" />
        <button type="button" onClick={() => { setAddingCategory(true); setError(""); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#356DDB] px-6 py-3 text-white"><Plus size={18} />เพิ่มหมวดหมู่</button>
      </section>

      {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredCategories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            editing={editingId === category.id}
            editName={editName}
            saving={saving}
            onEditName={setEditName}
            onStartEdit={startEdit}
            onCancelEdit={cancelEdit}
            onSave={update}
            onRemove={remove}
          />
        ))}
        {!filteredCategories.length && <p className="text-gray-400">{categories.length ? "ไม่พบหมวดหมู่ตามคำค้นหา" : "ยังไม่มีหมวดหมู่"}</p>}
      </div>

      {addingCategory && <AddCategoryModal name={name} saving={saving} onName={setName} onClose={closeAdd} onSubmit={add} />}
    </div>
  );
}
