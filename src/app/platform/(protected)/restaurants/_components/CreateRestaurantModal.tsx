/**
 * CreateRestaurantModal แสดงหน้าต่างสำหรับทำรายการในส่วนระบบผู้ดูแลแพลตฟอร์ม
 * ใช้รับข้อมูลจากส่วนอื่นและจัดการการโต้ตอบที่จำเป็นบนหน้าจอ
 */

"use client";

import { FormEvent, useState } from "react";
import { Building2, LockKeyhole, Mail, UserRound, X } from "lucide-react";
import { jsonRequest, platformRequest } from "../../_lib/api";

const fieldClass = "mt-2 block w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-gray-50";

export default function CreateRestaurantModal({
  onClose,
  onCompleted,
}: {
  onClose: () => void;
  onCompleted: (message: string) => void;
}) {
  const [restaurantName, setRestaurantName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await platformRequest<{ message: string }>(
        "/api/platform/restaurants",
        jsonRequest("POST", { restaurantName, displayName, username, email, password }),
      );
      onCompleted(result.message || `สร้างบัญชีร้าน ${restaurantName} แล้ว`);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto p-3 sm:p-4">
      <button type="button" aria-label="ปิดหน้าต่างเพิ่มบัญชีร้าน" disabled={busy} onClick={onClose} className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px] disabled:cursor-wait" />
      <form role="dialog" aria-modal="true" aria-labelledby="create-restaurant-title" onSubmit={submit} className="relative z-10 my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-100 bg-white p-4 shadow-2xl shadow-slate-950/20 sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Building2 size={21} /></span>
            <div>
              <h2 id="create-restaurant-title" className="font-semibold text-gray-900">เพิ่มบัญชีร้าน</h2>
              <p className="mt-1 text-sm leading-6 text-gray-500">บัญชีร้านจะเปิดใช้งานทันทีหลังสร้างสำเร็จ</p>
            </div>
          </div>
          <button type="button" disabled={busy} onClick={onClose} aria-label="ปิด" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 disabled:opacity-50"><X size={19} /></button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2 text-sm font-medium text-gray-700">
            ชื่อร้าน
            <span className="relative block"><Building2 size={17} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400" /><input autoFocus required maxLength={100} disabled={busy} value={restaurantName} onChange={event => setRestaurantName(event.target.value)} placeholder="ชื่อร้าน" className={`${fieldClass} pl-10`} /></span>
          </label>
          <label className="text-sm font-medium text-gray-700">
            ชื่อเจ้าของร้าน
            <span className="relative block"><UserRound size={17} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400" /><input required maxLength={100} disabled={busy} value={displayName} onChange={event => setDisplayName(event.target.value)} placeholder="ชื่อที่ใช้แสดงในระบบ" className={`${fieldClass} pl-10`} /></span>
          </label>
          <label className="text-sm font-medium text-gray-700">
            ชื่อผู้ใช้
            <span className="relative block"><UserRound size={17} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400" /><input required minLength={3} maxLength={30} pattern="[a-zA-Z0-9._-]+" autoCapitalize="none" autoComplete="off" disabled={busy} value={username} onChange={event => setUsername(event.target.value.toLowerCase().replace(/^@+/, ""))} placeholder="username" className={`${fieldClass} pl-10`} /></span>
          </label>
          <label className="sm:col-span-2 text-sm font-medium text-gray-700">
            อีเมล
            <span className="relative block"><Mail size={17} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400" /><input required type="email" maxLength={254} autoComplete="email" disabled={busy} value={email} onChange={event => setEmail(event.target.value)} placeholder="owner@example.com" className={`${fieldClass} pl-10`} /></span>
          </label>
          <label className="text-sm font-medium text-gray-700">
            รหัสผ่าน
            <span className="relative block"><LockKeyhole size={17} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400" /><input required type="password" minLength={8} maxLength={128} autoComplete="new-password" disabled={busy} value={password} onChange={event => setPassword(event.target.value)} placeholder="อย่างน้อย 8 ตัวอักษร" className={`${fieldClass} pl-10`} /></span>
          </label>
          <label className="text-sm font-medium text-gray-700">
            ยืนยันรหัสผ่าน
            <span className="relative block"><LockKeyhole size={17} className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-gray-400" /><input required type="password" minLength={8} maxLength={128} autoComplete="new-password" disabled={busy} value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} placeholder="กรอกรหัสผ่านอีกครั้ง" className={`${fieldClass} pl-10`} /></span>
          </label>
        </div>

        <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-700">เข้าสู่ระบบบัญชีร้านได้ทันที และสามารถยืนยันอีเมลภายหลังจากหน้าตั้งค่าบัญชีเพื่อเปิดใช้การกู้รหัสผ่าน</p>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">ยกเลิก</button>
          <button disabled={busy} className="rounded-xl bg-[#356DDB] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-50">{busy ? "กำลังสร้างบัญชี..." : "สร้างบัญชีร้าน"}</button>
        </div>
      </form>
    </div>
  );
}
