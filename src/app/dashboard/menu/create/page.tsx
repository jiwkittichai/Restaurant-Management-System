"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LoadErrorMessage from "../../_components/LoadErrorMessage";
import { fetchJson } from "@/lib/client-fetch";
import ModifierGroupsEditor from "../_components/ModifierGroupsEditor";
import MenuItemFormFields from "../_components/MenuItemFormFields";
import type {
  ModifierGroupDraft,
  MenuCategory,
  MenuItemForm,
} from "../types";

const initialForm = (): MenuItemForm => ({
  name: "",
  sku: `MENU-${Date.now().toString().slice(-6)}`,
  description: "",
  price: "",
  saleUnit: "จาน",
  categoryId: "",
});

export default function CreateMenuPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState<MenuItemForm>(initialForm);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroupDraft[]>(
    [],
  );

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  async function loadCategories() {
    try {
      const data = await fetchJson("/api/categories");
      if (!Array.isArray(data))
        throw new Error("รูปแบบข้อมูลหมวดหมู่ไม่ถูกต้อง");
      setCategories(data as MenuCategory[]);
      setLoadError("");
    } catch (loadFailure) {
      console.error("Failed to load categories for menu creation", loadFailure);
      setLoadError("โหลดหมวดหมู่ไม่สำเร็จ จึงยังไม่สามารถสร้างเมนูได้");
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      let image = "";
      if (file) {
        const body = new FormData();
        body.append("file", file);
        const upload = await fetch("/api/upload", { method: "POST", body });
        if (!upload.ok) throw new Error("อัปโหลดรูปไม่สำเร็จ");
        image = (await upload.json()).url;
      }
      const response = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image, modifierGroups }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.push("/dashboard/menu");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "เกิดข้อผิดพลาด",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-4">
        <LoadErrorMessage message={loadError} onRetry={loadCategories} />
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
            <label className="cursor-pointer rounded-xl bg-blue-50 px-4 py-2 text-blue-600">
              เลือกรูป
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
            {preview && (
              <div className="aspect-[4/3] w-40 overflow-hidden rounded-xl bg-gray-100">
                <img
                  src={preview}
                  alt="ตัวอย่างรูปเมนู"
                  className="h-full w-full object-cover object-center"
                />
              </div>
            )}
          </div>
        </div>
        <MenuItemFormFields
          form={form}
          categories={categories}
          onChange={(patch) => setForm((current) => ({ ...current, ...patch }))}
        />
        <ModifierGroupsEditor
          groups={modifierGroups}
          onChange={setModifierGroups}
        />
        {!categories.length && (
          <p className="text-sm text-amber-600">
            กรุณาสร้างหมวดหมู่ก่อนเพิ่มเมนู
          </p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3">
          <button
            disabled={loading || !categories.length}
            className="rounded-xl bg-[#356DDB] px-6 py-3 text-white disabled:opacity-50"
          >
            {loading ? "กำลังบันทึก..." : "บันทึกเมนู"}
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
