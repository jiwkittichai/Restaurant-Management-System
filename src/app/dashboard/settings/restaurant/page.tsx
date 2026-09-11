"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Upload, Pencil, Trash2, Save, X } from "lucide-react";
import type { RestaurantBrand } from "@/lib/restaurant-brand";
const empty = { name: "", logoUrl: null, address: "", phone: "", welcomeMessage: "", receiptFooter: "" };
export default function RestaurantSettings() {
  const router = useRouter();
  const [form, setForm] = useState<RestaurantBrand>(empty);
  const [saved, setSaved] = useState<RestaurantBrand>(empty);
  const [editing, setEditing] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const previewUrl = useRef<string | null>(null);
  useEffect(() => () => { if (previewUrl.current) URL.revokeObjectURL(previewUrl.current); }, []);
  function clearPreview() {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
  }
  function cancel() {
    if (busy) return;
    clearPreview(); setForm(saved); setLogoFile(null); setLogoChange(undefined); setEditing(false); setMessage("");
  }
  const [logoChange, setLogoChange] = useState<string | null | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => { fetch("/api/restaurant-profile").then(async res => { const data = await res.json(); if (!res.ok) throw new Error(data.error); setForm(data); setSaved(data); setReady(true); }).catch(e => setMessage(e.message)); }, []);
  function upload(file?: File) {
    if (!file || !editing || busy) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { setMessage("เลือก PNG, JPG หรือ WebP ขนาดไม่เกิน 5 MB"); return; }
    clearPreview();
    previewUrl.current = URL.createObjectURL(file);
    setLogoFile(file); setLogoChange(undefined);
    setForm(f => ({ ...f, logoUrl: previewUrl.current }));
    setMessage("เลือกรูปแล้ว กดบันทึกเพื่อนำไปใช้");
  }
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!editing || !ready || busy) return; setBusy(true); setMessage("");
    try {
      let nextLogo = logoChange;
      if (logoFile) {
        const payload = new FormData(); payload.set("file", logoFile); payload.set("purpose", "restaurant_logo");
        const uploadResponse = await fetch("/api/upload", { method: "POST", body: payload });
        const uploaded = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploaded.error);
        nextLogo = uploaded.url;
        setLogoChange(nextLogo); setLogoFile(null);
      }
      const res = await fetch("/api/restaurant-profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, address: form.address || "", phone: form.phone || "", welcomeMessage: form.welcomeMessage || "", receiptFooter: form.receiptFooter || "", logoUrl: nextLogo }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      clearPreview(); setForm(data); setSaved(data); setEditing(false); setLogoFile(null); setLogoChange(undefined); setMessage("บันทึกแล้ว หน้าเมนู ใบ QR และใบเสร็จจะใช้ข้อมูลร้านนี้"); router.refresh();
    } catch (e) { setMessage(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ"); } finally { setBusy(false); }
  }
  return <div className="p-4 lg:p-6 max-w-6xl"><h2 className="text-xl font-semibold">ข้อมูลและหน้าตาของร้าน</h2><p className="text-sm text-slate-500 mt-1 mb-6">ใช้ข้อมูลเดียวกันบนหน้าเมนูลูกค้า ใบสั่งอาหาร QR และใบเสร็จ</p>
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]"><form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5"><div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">ข้อมูลร้าน</h3><p className="text-xs text-slate-500 mt-1">{editing ? "แก้ไขข้อมูลแล้วกดบันทึกเพื่อนำไปใช้" : "กดแก้ไขเมื่อต้องการเปลี่ยนข้อมูลร้าน"}</p></div>{!editing && <button type="button" disabled={!ready || busy} onClick={() => { setEditing(true); setMessage(""); }} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm text-white disabled:opacity-50"><Pencil size={16}/>แก้ไข</button>}</div><fieldset disabled={!ready || busy} className="space-y-5">
      <div className="flex flex-wrap gap-4 items-center rounded-2xl border border-slate-100 bg-slate-50/60 p-4"><div className="w-24 h-24 shrink-0 rounded-2xl border border-slate-200 bg-white overflow-hidden grid place-items-center">{form.logoUrl ? <img src={form.logoUrl} alt="โลโก้ร้าน" className="block w-full h-full rounded-[inherit] object-contain"/> : <Store size={30} className="text-slate-300"/>}</div><div className="min-w-0"><p className="text-sm font-medium">โลโก้ร้าน</p>{editing ? <><div className="flex gap-2 mt-2"><button type="button" onClick={() => fileInput.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-700"><Upload size={16}/>{form.logoUrl ? "เปลี่ยนรูป" : "เลือกรูปโลโก้"}</button>{form.logoUrl && <button type="button" aria-label="ลบโลโก้" title="ลบโลโก้" onClick={() => { clearPreview(); setLogoFile(null); setForm(f => ({ ...f, logoUrl: null })); setLogoChange(null); setMessage("นำโลโก้ออกเมื่อกดบันทึก หรือกดยกเลิกเพื่อใช้รูปเดิม"); }} className="rounded-lg border border-red-100 bg-white p-2 text-red-500 hover:bg-red-50"><Trash2 size={18}/></button>}</div><input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" aria-label="เลือกรูปโลโก้" className="hidden" onChange={e => { upload(e.target.files?.[0]); e.target.value = ""; }}/><p className="text-xs text-slate-400 mt-2">PNG, JPG หรือ WebP ไม่เกิน 5 MB</p><p className="text-xs text-slate-400 mt-1">แนะนำรูปสี่เหลี่ยมจัตุรัส พื้นหลังโปร่งใส</p></> : <p className="text-xs text-slate-500 mt-1">{form.logoUrl ? "แสดงบนหน้าเมนูและใบพิมพ์ของร้าน" : "ยังไม่ได้เพิ่มโลโก้ร้าน"}</p>}</div></div>
      {([{ key: "name", label: "ชื่อร้าน", max: 100, hint: "เช่น ครัวบ้านสวน" }, { key: "phone", label: "เบอร์โทรติดต่อ", max: 50, hint: "เช่น 02-123-4567" }, { key: "address", label: "ที่อยู่ร้าน", max: 500, hint: "แสดงบนใบเสร็จ" }, { key: "welcomeMessage", label: "ข้อความต้อนรับบนหน้าเมนู", max: 200, hint: "เช่น อาหารอร่อย ทำสดทุกจาน" }, { key: "receiptFooter", label: "ข้อความท้ายใบพิมพ์", max: 300, hint: "เช่น ขอบคุณที่อุดหนุน แล้วพบกันใหม่" }] as const).map(field => <label key={field.key} className="block text-sm font-medium">{field.label}{field.key === "name" ? " *" : ""}<textarea readOnly={!editing} required={field.key === "name"} maxLength={field.max} rows={field.key === "address" || field.key === "receiptFooter" ? 3 : 1} value={form[field.key] || ""} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={editing ? field.hint : "ยังไม่ระบุ"} className={`block mt-2 border rounded-xl p-3 w-full font-normal outline-none ${editing ? "border-slate-200 bg-white focus:border-blue-500" : "border-transparent bg-slate-50 text-slate-700 resize-none"}`}/></label>)}
      {editing && <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={cancel} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600"><X size={16}/>ยกเลิก</button><button className="inline-flex items-center gap-2 bg-blue-600 text-white rounded-xl px-5 py-3 text-sm"><Save size={16}/>{busy ? "กำลังบันทึก…" : "บันทึกข้อมูลร้าน"}</button></div>}</fieldset>{message && <p role="status" className="text-sm text-blue-700">{message}</p>}</form>
      <aside><p className="text-sm text-slate-500 mb-3">ตัวอย่างหน้าลูกค้า</p><div className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm"><div className="p-5 border-b border-slate-100">{form.logoUrl && <img src={form.logoUrl} alt="ตัวอย่างโลโก้" className="w-16 h-16 object-contain mb-3"/>}<p className="text-xs text-slate-500 whitespace-pre-wrap">{form.welcomeMessage || "ยินดีต้อนรับ · สั่งอาหารร่วมโต๊ะ"}</p><h3 className="text-xl font-semibold break-words mt-1">{form.name || "ชื่อร้านของคุณ"}</h3></div><div className="p-5 bg-slate-50"><span className="text-sm text-blue-600">เมนูอาหาร · โต๊ะ 1</span><div className="mt-4 h-24 rounded-xl bg-white border border-dashed grid place-items-center text-slate-400">เมนูของร้าน</div></div></div><div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-center"><p className="font-semibold">ตัวอย่างหัวใบเสร็จ</p><p className="mt-4 font-semibold break-words">{form.name || "ชื่อร้านของคุณ"}</p><p className="text-xs whitespace-pre-wrap mt-2">{form.address}</p>{form.phone && <p className="text-xs mt-1">โทร. {form.phone}</p>}<p className="text-xs whitespace-pre-wrap border-t mt-4 pt-4">{form.receiptFooter || "ขอบคุณที่ใช้บริการ"}</p></div></aside>
    </div></div>;
}
