"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import LoadErrorMessage from "../../_components/LoadErrorMessage";
import { fetchJson } from "@/lib/client-fetch";
import type { ProductListItem } from "../types";
import DeleteProductDialog from "./DeleteProductDialog";
import ProductTable from "./ProductTable";

export default function ProductsPageClient() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [confirmingDelete, setConfirmingDelete] =
    useState<ProductListItem | null>(null);
  const load = useCallback(async () => {
    try {
      const data = await fetchJson("/api/menu");
      if (!Array.isArray(data)) throw new Error("รูปแบบข้อมูลเมนูไม่ถูกต้อง");
      setProducts(data as ProductListItem[]);
      setLoadError("");
    } catch (loadFailure) {
      console.error("Failed to load menu items", loadFailure);
      setLoadError("โหลดเมนูอาหารไม่สำเร็จ ข้อมูลเดิมยังคงแสดงอยู่");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(product: ProductListItem) {
    await fetch("/api/menu", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, available: !product.available }),
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
  const query = search.toLowerCase();
  const filteredProducts = products.filter((product) =>
    `${product.name} ${product.sku} ${product.category.name}`
      .toLowerCase()
      .includes(query),
  );

  return (
    <div className="p-6">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ค้นหาเมนู"
            className="w-full rounded-xl border border-gray-100 bg-white py-3 pl-10 pr-4 outline-none"
          />
        </div>
        <button
          onClick={() => router.push("/dashboard/products/create")}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#356DDB] px-5 py-3 text-white"
        >
          <Plus size={18} /> เพิ่มเมนู
        </button>
      </div>
      {error && <p className="mb-3 text-red-500">{error}</p>}
      <div className="mb-3">
        <LoadErrorMessage message={loadError} onRetry={load} />
      </div>
      <ProductTable
        products={filteredProducts}
        onEdit={(product) =>
          router.push(`/dashboard/products/${product.id}/edit`)
        }
        onDelete={setConfirmingDelete}
        onToggle={toggle}
      />
      {confirmingDelete && (
        <DeleteProductDialog
          product={confirmingDelete}
          onClose={() => setConfirmingDelete(null)}
          onConfirm={() => remove(confirmingDelete.id)}
        />
      )}
    </div>
  );
}
