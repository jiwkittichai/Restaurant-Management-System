"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Mail, Pencil, ShieldCheck, Store, Trash2, Upload, X } from "lucide-react";
import { jsonRequest, platformRequest } from "../../_lib/api";

const inputClass = "rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50";

type Settings = { name: string; registrationOpen: boolean };

export default function PlatformSettingsForm({ initialSettings, initialLogoUrl, emailConfigured }: { initialSettings: Settings; initialLogoUrl: string | null; emailConfigured: boolean }) {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoPreviewRef = useRef<string | null>(null);
  const [settings, setSettings] = useState(initialSettings);
  const [saved, setSaved] = useState(initialSettings);
  const [platformLogo, setPlatformLogo] = useState(initialLogoUrl);
  const [editing, setEditing] = useState(false);
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => () => { if (logoPreviewRef.current) URL.revokeObjectURL(logoPreviewRef.current); }, []);

  function clearPending() {
    if (logoPreviewRef.current) URL.revokeObjectURL(logoPreviewRef.current);
    logoPreviewRef.current = null;
    setPendingLogo(null);
    setPendingPreview(null);
    setRemoveLogo(false);
    if (logoInputRef.current) logoInputRef.current.value = "";
  }

  function beginEdit() {
    clearPending();
    setSettings(saved);
    setError("");
    setMessage("");
    setEditing(true);
  }

  function cancelEdit() {
    if (busy) return;
    clearPending();
    setSettings(saved);
    setError("");
    setEditing(false);
  }

  function selectLogo(file?: File) {
    if (!file) return;
    setError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) return setError("รองรับไฟล์ PNG, JPG หรือ WebP เท่านั้น");
    if (file.size > 5 * 1024 * 1024) return setError("ไฟล์โลโก้ต้องมีขนาดไม่เกิน 5 MB");
    if (logoPreviewRef.current) URL.revokeObjectURL(logoPreviewRef.current);
    const preview = URL.createObjectURL(file);
    logoPreviewRef.current = preview;
    setPendingLogo(file);
    setPendingPreview(preview);
    setRemoveLogo(false);
  }

  function useDefaultIcon() {
    if (logoPreviewRef.current) URL.revokeObjectURL(logoPreviewRef.current);
    logoPreviewRef.current = null;
    setPendingLogo(null);
    setPendingPreview(null);
    setRemoveLogo(true);
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await platformRequest<Settings>("/api/platform/settings", jsonRequest("PATCH", settings));
      setSettings(result);
      setSaved(result);
      if (pendingLogo) {
        const body = new FormData();
        body.set("file", pendingLogo);
        const logoResult = await platformRequest<{ logoUrl: string }>("/api/platform/logo", { method: "POST", body });
        setPlatformLogo(logoResult.logoUrl);
      } else if (removeLogo && platformLogo) {
        await platformRequest("/api/platform/logo", { method: "DELETE" });
        setPlatformLogo(null);
      }
      clearPending();
      setEditing(false);
      setMessage("บันทึกการตั้งค่าแล้ว");
      router.refresh();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const displayedLogo = pendingPreview || (removeLogo ? null : platformLogo);
  const changed = settings.name.trim() !== saved.name || settings.registrationOpen !== saved.registrationOpen || Boolean(pendingLogo) || (removeLogo && Boolean(platformLogo));

  return <form onSubmit={save} className="max-w-5xl space-y-5">{error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}{message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{message}</p>}<section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6"><div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5"><div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Building2 size={21} /></span><div><h2 className="font-semibold">ข้อมูลแพลตฟอร์ม</h2><p className="mt-1 text-sm text-gray-400">ชื่อและโลโก้ที่ใช้แสดงในระบบ</p></div></div>{!editing && <button type="button" onClick={beginEdit} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-600"><Pencil size={16} />แก้ไข</button>}</div><div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl bg-gray-50 p-4"><div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border border-gray-200 bg-white">{displayedLogo ? <img src={displayedLogo} alt="โลโก้แพลตฟอร์ม" className="h-full w-full object-contain" /> : <ShieldCheck size={32} className="text-blue-500" />}</div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-gray-700">โลโก้แพลตฟอร์ม</p>{editing ? <><div className="mt-2 flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => logoInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-600"><Upload size={16} />{displayedLogo ? "เปลี่ยนรูป" : "เลือกรูปโลโก้"}</button>{displayedLogo && <button type="button" disabled={busy} onClick={useDefaultIcon} className="inline-flex items-center gap-2 rounded-lg border border-red-100 bg-white px-3 py-2 text-sm font-medium text-red-500"><Trash2 size={16} />ใช้ไอคอนเริ่มต้น</button>}</div><input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={event => { selectLogo(event.target.files?.[0]); event.target.value = ""; }} /><p className="mt-2 text-xs text-gray-400">PNG, JPG หรือ WebP ไม่เกิน 5 MB</p></> : <p className="mt-2 text-xs text-gray-400">{platformLogo ? "กำลังใช้โลโก้ที่อัปโหลด" : "กำลังใช้ไอคอนเริ่มต้น"}</p>}</div></div><label className="mt-5 block text-sm font-medium text-gray-600">ชื่อแพลตฟอร์ม<input required disabled={!editing || busy} maxLength={100} value={settings.name} onChange={event => setSettings({ ...settings, name: event.target.value })} className={`${inputClass} mt-2 w-full disabled:bg-gray-50`} /></label></section><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6"><div className="flex items-start gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl ${settings.registrationOpen ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}><Store size={21} /></span><div><h2 className="font-semibold">การรับสมัครร้าน</h2><p className="mt-1 text-sm text-gray-400">ควบคุมการรับคำขอจากร้านใหม่</p></div></div><label className={`mt-5 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-4 text-sm font-medium ${editing ? "cursor-pointer" : "cursor-default"}`}><span>เปิดรับสมัครร้านใหม่</span><input type="checkbox" disabled={!editing || busy} checked={settings.registrationOpen} onChange={event => setSettings({ ...settings, registrationOpen: event.target.checked })} className="h-5 w-5 accent-blue-600" /></label></section><section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6"><div className="flex items-start gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl ${emailConfigured ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}><Mail size={21} /></span><div><h2 className="font-semibold">ระบบอีเมล</h2><p className="mt-1 text-sm text-gray-400">สำหรับยืนยันอีเมลและรีเซ็ตรหัสผ่าน</p></div></div><div className="mt-5 flex items-center justify-between rounded-xl bg-gray-50 px-4 py-4"><span className="text-sm font-medium text-gray-600">สถานะการเชื่อมต่อ</span><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${emailConfigured ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"}`}>{emailConfigured ? "พร้อมใช้งาน" : "ยังไม่ได้ตั้งค่า"}</span></div></section></div>{editing && <div className="flex justify-end gap-3"><button type="button" disabled={busy} onClick={cancelEdit} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600"><X size={17} />ยกเลิก</button><button disabled={busy || !changed || !settings.name.trim()} className="rounded-xl bg-[#356DDB] px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">{busy ? "กำลังบันทึก..." : "บันทึก"}</button></div>}</form>;
}
