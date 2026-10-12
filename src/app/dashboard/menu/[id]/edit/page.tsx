"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import LoadErrorMessage from "../../../_components/LoadErrorMessage";
import { fetchJson } from "@/lib/client-fetch";
import ModifierGroupsEditor from "../../_components/ModifierGroupsEditor";
import MenuItemFormFields from "../../_components/MenuItemFormFields";
import type {
  EditableMenuItem,
  ModifierGroupDraft,
  MenuCategory,
  MenuItemForm,
} from "../../types";

type EditMenuItemForm = MenuItemForm & {
  image: string;
  available: boolean;
};

const emptyForm: EditMenuItemForm = {
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
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [form, setForm] = useState<EditMenuItemForm>(emptyForm);
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
      const item = (menuData as EditableMenuItem[]).find(
        (menuItem) => menuItem.id === Number(params.id),
      );
      setCategories(categoriesData as MenuCategory[]);
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
      router.push("/dashboard/menu");
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
  const displayedImage = preview || form.image;
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
          <div className="mt-2 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="grid aspect-[4/3] w-40 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {displayedImage ? (
                <img
                  src={displayedImage}
                  alt="รูปเมนู"
                  className="block h-full w-full rounded-[inherit] object-cover object-center"
                />
              ) : (
                <span className="grid h-full w-full place-items-center text-slate-300">
                  <ImageIcon size={28} />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800">
                {form.name || "รูปเมนู"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-50">
                  <Upload size={16} />
                  {displayedImage ? "เปลี่ยนรูป" : "เลือกรูป"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const selected = event.target.files?.[0];
                      if (selected) {
                        setFile(selected);
                        setPreview(URL.createObjectURL(selected));
                      }
                      event.target.value = "";
                    }}
                  />
                </label>
                {displayedImage && (
                  <button
                    type="button"
                    aria-label="ลบรูปเมนู"
                    title="ลบรูปเมนู"
                    onClick={() => {
                      setForm((current) => ({ ...current, image: "" }));
                      setPreview("");
                      setFile(null);
                    }}
                    className="rounded-lg border border-red-100 bg-white p-2 text-red-500 transition hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                PNG, JPG หรือ WebP ไม่เกิน 5 MB
              </p>
              <p className="mt-1 text-xs text-slate-400">
                แนะนำภาพแนวนอนอัตราส่วน 4:3 เช่น 1200 × 900 พิกเซล
              </p>
            </div>
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
