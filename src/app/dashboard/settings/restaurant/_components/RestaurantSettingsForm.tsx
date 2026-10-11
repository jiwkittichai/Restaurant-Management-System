"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, Store, Trash2, Upload, X } from "lucide-react";
import type { RestaurantBrand } from "@/lib/restaurant-brand";
import RestaurantPreview from "./RestaurantPreview";

const emptyRestaurant: RestaurantBrand = {
  name: "",
  logoUrl: null,
  address: "",
  phone: "",
  welcomeMessage: "",
  receiptFooter: "",
};
const fields = [
  { key: "name", label: "ชื่อร้าน", max: 100, hint: "เช่น ครัวบ้านสวน" },
  { key: "phone", label: "เบอร์โทรติดต่อ", max: 50, hint: "เช่น 02-123-4567" },
  { key: "address", label: "ที่อยู่ร้าน", max: 500, hint: "แสดงบนใบเสร็จ" },
  {
    key: "welcomeMessage",
    label: "ข้อความต้อนรับบนหน้าเมนู",
    max: 200,
    hint: "เช่น อาหารอร่อย ทำสดทุกจาน",
  },
  {
    key: "receiptFooter",
    label: "ข้อความท้ายใบพิมพ์",
    max: 300,
    hint: "เช่น ขอบคุณที่อุดหนุน แล้วพบกันใหม่",
  },
] as const;

export default function RestaurantSettingsForm() {
  const router = useRouter();
  const [form, setForm] = useState<RestaurantBrand>(emptyRestaurant);
  const [saved, setSaved] = useState<RestaurantBrand>(emptyRestaurant);
  const [editing, setEditing] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoChange, setLogoChange] = useState<string | null | undefined>(
    undefined,
  );
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const previewUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    },
    [],
  );
  useEffect(() => {
    fetch("/api/restaurant-profile")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setForm(data);
        setSaved(data);
        setReady(true);
      })
      .catch((error) => setMessage(error.message));
  }, []);

  function clearPreview() {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
  }

  function cancel() {
    if (busy) return;
    clearPreview();
    setForm(saved);
    setLogoFile(null);
    setLogoChange(undefined);
    setEditing(false);
    setMessage("");
  }

  function upload(file?: File) {
    if (!file || !editing || busy) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setMessage("เลือก PNG, JPG หรือ WebP ขนาดไม่เกิน 5 MB");
      return;
    }
    clearPreview();
    previewUrl.current = URL.createObjectURL(file);
    setLogoFile(file);
    setLogoChange(undefined);
    setForm((current) => ({ ...current, logoUrl: previewUrl.current }));
    setMessage("เลือกรูปแล้ว กดบันทึกเพื่อนำไปใช้");
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing || !ready || busy) return;
    setBusy(true);
    setMessage("");
    try {
      let nextLogo = logoChange;
      if (logoFile) {
        const payload = new FormData();
        payload.set("file", logoFile);
        payload.set("purpose", "restaurant_logo");
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: payload,
        });
        const uploaded = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploaded.error);
        nextLogo = uploaded.url;
        setLogoChange(nextLogo);
        setLogoFile(null);
      }
      const response = await fetch("/api/restaurant-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          address: form.address || "",
          phone: form.phone || "",
          welcomeMessage: form.welcomeMessage || "",
          receiptFooter: form.receiptFooter || "",
          logoUrl: nextLogo,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      clearPreview();
      setForm(data);
      setSaved(data);
      setEditing(false);
      setLogoFile(null);
      setLogoChange(undefined);
      setMessage("บันทึกแล้ว หน้าเมนู ใบ QR และใบเสร็จจะใช้ข้อมูลร้านนี้");
      router.refresh();
    } catch (saveError) {
      setMessage(
        saveError instanceof Error ? saveError.message : "บันทึกไม่สำเร็จ",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-6xl p-4 lg:p-6">
      <h2 className="text-xl font-semibold">ข้อมูลและหน้าตาของร้าน</h2>
      <p className="mb-6 mt-1 text-sm text-slate-500">
        ใช้ข้อมูลเดียวกันบนหน้าเมนูลูกค้า ใบสั่งอาหาร QR และใบเสร็จ
      </p>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <form
          onSubmit={save}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">ข้อมูลร้าน</h3>
              <p className="mt-1 text-xs text-slate-500">
                {editing
                  ? "แก้ไขข้อมูลแล้วกดบันทึกเพื่อนำไปใช้"
                  : "กดแก้ไขเมื่อต้องการเปลี่ยนข้อมูลร้าน"}
              </p>
            </div>
            {!editing && (
              <button
                type="button"
                disabled={!ready || busy}
                onClick={() => {
                  setEditing(true);
                  setMessage("");
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm text-white disabled:opacity-50"
              >
                <Pencil size={16} />
                แก้ไข
              </button>
            )}
          </div>
          <fieldset disabled={!ready || busy} className="space-y-5">
            <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
              <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {form.logoUrl ? (
                  <img
                    src={form.logoUrl}
                    alt="โลโก้ร้าน"
                    className="block h-full w-full rounded-[inherit] object-contain"
                  />
                ) : (
                  <Store size={30} className="text-slate-300" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium">โลโก้ร้าน</p>
                {editing ? (
                  <>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-700"
                      >
                        <Upload size={16} />
                        {form.logoUrl ? "เปลี่ยนรูป" : "เลือกรูปโลโก้"}
                      </button>
                      {form.logoUrl && (
                        <button
                          type="button"
                          aria-label="ลบโลโก้"
                          title="ลบโลโก้"
                          onClick={() => {
                            clearPreview();
                            setLogoFile(null);
                            setForm((current) => ({
                              ...current,
                              logoUrl: null,
                            }));
                            setLogoChange(null);
                            setMessage(
                              "นำโลโก้ออกเมื่อกดบันทึก หรือกดยกเลิกเพื่อใช้รูปเดิม",
                            );
                          }}
                          className="rounded-lg border border-red-100 bg-white p-2 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      aria-label="เลือกรูปโลโก้"
                      className="hidden"
                      onChange={(event) => {
                        upload(event.target.files?.[0]);
                        event.target.value = "";
                      }}
                    />
                    <p className="mt-2 text-xs text-slate-400">
                      PNG, JPG หรือ WebP ไม่เกิน 5 MB
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      แนะนำรูปสี่เหลี่ยมจัตุรัส พื้นหลังโปร่งใส
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-xs text-slate-500">
                    {form.logoUrl
                      ? "แสดงบนหน้าเมนูและใบพิมพ์ของร้าน"
                      : "ยังไม่ได้เพิ่มโลโก้ร้าน"}
                  </p>
                )}
              </div>
            </div>
            {fields.map((field) => (
              <label key={field.key} className="block text-sm font-medium">
                {field.label}
                {field.key === "name" ? " *" : ""}
                <textarea
                  readOnly={!editing}
                  required={field.key === "name"}
                  maxLength={field.max}
                  rows={
                    field.key === "address" || field.key === "receiptFooter"
                      ? 3
                      : 1
                  }
                  value={form[field.key] || ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      [field.key]: event.target.value,
                    }))
                  }
                  placeholder={editing ? field.hint : "ยังไม่ระบุ"}
                  className={`mt-2 block w-full rounded-xl border p-3 font-normal outline-none ${editing ? "border-slate-200 bg-white focus:border-blue-500" : "resize-none border-transparent bg-slate-50 text-slate-700"}`}
                />
              </label>
            ))}
            {editing && (
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={cancel}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600"
                >
                  <X size={16} />
                  ยกเลิก
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm text-white">
                  <Save size={16} />
                  {busy ? "กำลังบันทึก…" : "บันทึกข้อมูลร้าน"}
                </button>
              </div>
            )}
          </fieldset>
          {message && (
            <p role="status" className="text-sm text-blue-700">
              {message}
            </p>
          )}
        </form>
        <RestaurantPreview restaurant={form} />
      </div>
    </div>
  );
}
