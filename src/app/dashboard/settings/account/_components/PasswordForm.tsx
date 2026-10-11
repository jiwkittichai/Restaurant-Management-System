"use client";

import { FormEvent, useState } from "react";
import { KeyRound, ShieldCheck, X } from "lucide-react";
import type { AccountTask, Feedback } from "../types";
import FeedbackMessage from "./FeedbackMessage";

const emptyPassword = { current: "", next: "", confirm: "" };

export default function PasswordForm({ busyTask, onBusyTask }: { busyTask: AccountTask; onBusyTask: (task: AccountTask) => void }) {
  const [password, setPassword] = useState(emptyPassword);
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const busy = busyTask !== null;

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);
    if (password.next !== password.confirm) {
      setFeedback({ type: "error", text: "รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน" });
      return;
    }
    onBusyTask("password");
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "password", currentPassword: password.current, newPassword: password.next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      setPassword(emptyPassword);
      setEditing(false);
      setFeedback({ type: "success", text: data.message });
    } catch (error) {
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "เชื่อมต่อไม่สำเร็จ" });
    } finally {
      onBusyTask(null);
    }
  }

  function cancelEdit() {
    setPassword(emptyPassword);
    setFeedback(null);
    setEditing(false);
  }

  return (
    <form onSubmit={changePassword} className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><KeyRound size={20} /></div>
          <div><h3 className="font-semibold text-gray-900">รหัสผ่าน</h3><p className="mt-0.5 text-sm text-gray-400">เปลี่ยนรหัสผ่านสำหรับเข้าสู่ระบบ</p></div>
        </div>
        {!editing && <button type="button" onClick={() => { setFeedback(null); setEditing(true); }} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-600"><KeyRound size={16} />เปลี่ยนรหัสผ่าน</button>}
      </div>
      {editing && (
        <>
          <p className="mt-5 text-sm text-gray-500">หลังเปลี่ยนรหัสผ่าน ระบบจะให้ออกจากระบบอุปกรณ์อื่น โดยอุปกรณ์นี้ยังใช้งานต่อได้</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2"><span className="text-sm font-medium text-gray-700">รหัสผ่านปัจจุบัน</span><input required type="password" maxLength={128} autoComplete="current-password" value={password.current} onChange={(event) => setPassword({ ...password, current: event.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400" /></label>
            <label className="block"><span className="text-sm font-medium text-gray-700">รหัสผ่านใหม่</span><input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={password.next} onChange={(event) => setPassword({ ...password, next: event.target.value })} placeholder="อย่างน้อย 8 ตัวอักษร" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400" /></label>
            <label className="block"><span className="text-sm font-medium text-gray-700">ยืนยันรหัสผ่านใหม่</span><input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={password.confirm} onChange={(event) => setPassword({ ...password, confirm: event.target.value })} placeholder="กรอกรหัสผ่านใหม่อีกครั้ง" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400" /></label>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" disabled={busy} onClick={cancelEdit} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-gray-600 disabled:opacity-50"><X size={16} />ยกเลิก</button>
            <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-white disabled:opacity-50"><ShieldCheck size={17} />{busyTask === "password" ? "กำลังเปลี่ยน..." : "ยืนยันเปลี่ยนรหัสผ่าน"}</button>
          </div>
        </>
      )}
      <FeedbackMessage feedback={feedback} />
    </form>
  );
}
