"use client";

import { FormEvent, useState } from "react";
import { BadgeCheck, Mail, Pencil, Save, X } from "lucide-react";
import type { Account, AccountTask, Feedback } from "../types";
import FeedbackMessage from "./FeedbackMessage";

export default function EmailForm({ account, busyTask, onBusyTask }: { account: Account; busyTask: AccountTask; onBusyTask: (task: AccountTask) => void }) {
  const [email, setEmail] = useState(account.email);
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const busy = busyTask !== null;
  const normalizedEmail = email.trim().toLowerCase();
  const currentEmail = account.email.trim().toLowerCase();
  const emailAlreadyVerified = account.emailVerified && normalizedEmail === currentEmail;

  async function requestEmailVerification(event: FormEvent) {
    event.preventDefault();
    onBusyTask("email");
    setFeedback(null);
    try {
      const response = await fetch("/api/account/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ส่งลิงก์ยืนยันไม่สำเร็จ");
      setEmail(account.email);
      setEditing(false);
      setFeedback({ type: "success", text: data.message });
    } catch (error) {
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "เชื่อมต่อไม่สำเร็จ" });
    } finally {
      onBusyTask(null);
    }
  }

  function cancelEdit() {
    setEmail(account.email);
    setFeedback(null);
    setEditing(false);
  }

  return (
    <form onSubmit={requestEmailVerification} className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Mail size={20} /></div>
          <div><h3 className="font-semibold text-gray-900">อีเมลบัญชี</h3><p className="mt-0.5 text-sm text-gray-400">ใช้ยืนยันบัญชีและกู้รหัสผ่าน</p></div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${account.emailVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
            {account.emailVerified ? <BadgeCheck size={15} /> : <Mail size={14} />}{account.emailVerified ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"}
          </span>
          {!editing && !account.emailVerified && <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#356DDB] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"><Mail size={16} />{busyTask === "email" ? "กำลังส่ง..." : "ส่งลิงก์ยืนยัน"}</button>}
          {!editing && <button type="button" onClick={() => { setFeedback(null); setEditing(true); }} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-600"><Pencil size={16} />{account.emailVerified ? "แก้ไข" : "เปลี่ยนอีเมล"}</button>}
        </div>
      </div>
      <fieldset disabled={!editing || busy} className="mt-5 disabled:opacity-100">
        <label className="block"><span className="text-sm font-medium text-gray-700">อีเมล</span><input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none disabled:bg-gray-50 disabled:text-gray-700 focus:border-blue-400" /></label>
      </fieldset>
      {editing && <p className="mt-3 text-xs text-gray-400">หากเปลี่ยนอีเมล ระบบจะใช้อีเมลเดิมต่อไปจนกว่าคุณจะกดลิงก์ยืนยันในอีเมลใหม่</p>}
      <FeedbackMessage feedback={feedback} />
      {editing && (
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" disabled={busy} onClick={cancelEdit} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-gray-600 disabled:opacity-50"><X size={16} />ยกเลิก</button>
          <button disabled={busy || emailAlreadyVerified} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#356DDB] px-5 py-3 text-white disabled:opacity-50"><Save size={17} />{busyTask === "email" ? "กำลังบันทึก..." : "บันทึก"}</button>
        </div>
      )}
    </form>
  );
}
