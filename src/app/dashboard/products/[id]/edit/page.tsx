"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import LoadErrorMessage from "../../../_components/LoadErrorMessage";
import { fetchJson } from "@/lib/client-fetch";
import ModifierGroupsEditor from "../../_components/ModifierGroupsEditor";
import ProductFormFields from "../../_components/ProductFormFields";
import type {
  EditableProduct,
  ModifierGroupDraft,
  ProductCategory,
  ProductForm,
} from "../../types";

type EditProductForm = ProductForm & {
  image: string;
  available: boolean;
};

const emptyForm: EditProductForm = {
  name: "",
  sku: "",
  description: "",
  price: "",
  saleUnit: "จาน",
  categoryId: "",
  image: "",
  available: true,
};

export default function EditMenuPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [form, setForm] = useState<EditProductForm>(emptyForm);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroupDraft[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [menuData, categoriesData] = await Promise.all([
        fetchJson("/api/menu"),
        fetchJson("/api/categories"),
      ]);
      if (!Array.isArray(menuData) || !Array.isArray(categoriesData))
        throw new Error("รูปแบบข้อมูลเมนูไม่ถูกต้อง");
      const item = (menuData as EditableProduct[]).find(
        (product) => product.id === Number(params.id),
      );
      setCategories(categoriesData as ProductCategory[]);
      if (!item) {
        setError("ไม่พบเมนูอาหาร");
        setLoadError("");
        return;
      }
      setForm({
        name: item.name,
        sku: item.sku,
        description: item.description || "",
        price: String(item.price),
        saleUnit: item.saleUnit || "จาน",
        categoryId: String(item.categoryId),
        image: item.image || "",
        available: item.available,
      });
      setModifierGroups(
        (item.modifierGroups || []).map((group) => ({
          name: group.name,
          required: group.required,
          minSelect: String(group.minSelect),
          maxSelect: String(group.maxSelect),
          options: group.options.map((option) => ({
            name: option.name,
            price: String(option.price),
          })),
        })),
      );
      setLoadError("");
    } catch (loadFailure) {
      console.error("Failed to load menu for editing", loadFailure);
      setLoadError("โหลดข้อมูลเมนูไม่สำเร็จ ข้อมูลเดิมยังคงแสดงอยู่");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      let image = form.image;
      if (file) {
        const body = new FormData();
        body.append("file", file);
        const upload = await fetch("/api/upload", { method: "POST", body });
        if (!upload.ok) throw new Error("อัปโหลดรูปไม่สำเร็จ");
        image = (await upload.json()).url;
      }
      const response = await fetch("/api/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          id: Number(params.id),
          image,
          modifierGroups,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.push("/dashboard/products");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "แก้ไขเมนูไม่สำเร็จ",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="p-10 text-center text-gray-400">กำลังโหลดข้อมูล...</div>
    );
  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4">
        <LoadErrorMessage message={loadError} onRetry={load} />
      </div>
      <form
        onSubmit={submit}
        className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6"
      >
        <div>
          <label className="text-sm text-gray-600">รูปเมนู</label>
          <p className="mt-1 text-xs text-gray-400">
            แนะนำภาพแนวนอนอัตราส่วน 4:3 เช่น 1200 × 900 พิกเซล
          </p>
          <div className="mt-3 flex items-center gap-4">
            <div className="aspect-[4/3] w-40 overflow-hidden rounded-xl bg-gray-100">
              {(preview || form.image) && (
                <img
                  src={preview || form.image}
                  alt="รูปเมนู"
                  className="h-full w-full object-cover object-center"
                />
              )}
            </div>
            <div className="space-y-2">
              <label className="block w-fit cursor-pointer rounded-xl bg-blue-50 px-4 py-2 text-blue-600">
                เปลี่ยนรูป
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const selected = event.target.files?.[0];
                    if (selected) {
                      setFile(selected);
                      setPreview(URL.createObjectURL(selected));
                    }
                  }}
                />
              </label>
              {form.image && (
                <button
                  type="button"
                  onClick={() => {
                    setForm({ ...form, image: "" });
                    setPreview("");
                    setFile(null);
                  }}
                  className="text-xs text-red-500"
                >
                  ลบรูปปัจจุบัน
                </button>
              )}
            </div>
          </div>
        </div>
        <ProductFormFields
          form={form}
          categories={categories}
          onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
        />
        <ModifierGroupsEditor
          groups={modifierGroups}
          onChange={setModifierGroups}
        />
        <label className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3">
          <span>
            <b className="text-sm">สถานะพร้อมขาย</b>
            <small className="block text-gray-400">
              ปิดสถานะเพื่อซ่อนเมนูจากหน้ารับออเดอร์
            </small>
          </span>
          <input
            type="checkbox"
            checked={form.available}
            onChange={(event) =>
              setForm({ ...form, available: event.target.checked })
            }
            className="h-5 w-5 accent-blue-600"
          />
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3">
          <button
            disabled={
              saving || Boolean(loadError) || error === "ไม่พบเมนูอาหาร"
            }
            className="rounded-xl bg-[#356DDB] px-6 py-3 text-white disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl bg-gray-100 px-6 py-3"
          >
            ยกเลิก
          </button>
        </div>
      </form>
    </div>
  );
}
