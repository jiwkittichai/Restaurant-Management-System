/**
 * ProfileForm เป็นฟอร์มสำหรับการตั้งค่าบัญชีผู้ใช้
 * ใช้จัดการข้อมูลบนหน้าจอ ติดต่อ API และแจ้งผลสำเร็จหรือข้อผิดพลาดให้ผู้ใช้
 */

"use client";

import { FormEvent, useState } from "react";
import { Pencil, Save, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Account, AccountTask, Feedback } from "../types";
import FeedbackMessage from "./FeedbackMessage";

export default function ProfileForm({ account, busyTask, onBusyTask }: { account: Account; busyTask: AccountTask; onBusyTask: (task: AccountTask) => void }) {
  const router = useRouter();
  const initialProfile = { displayName: account.displayName, username: account.username };
  const [profile, setProfile] = useState(initialProfile);
  const [savedProfile, setSavedProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const busy = busyTask !== null;

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    onBusyTask("profile");
    setFeedback(null);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "profile", ...profile }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");
      setSavedProfile(profile);
      setEditing(false);
      setFeedback({ type: "success", text: data.message });
      router.refresh();
    } catch (error) {
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "เชื่อมต่อไม่สำเร็จ" });
    } finally {
      onBusyTask(null);
    }
  }

  function cancelEdit() {
    setProfile(savedProfile);
    setFeedback(null);
    setEditing(false);
  }

  return (
    <form onSubmit={saveProfile} className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><UserRound size={20} /></div>
          <div><h3 className="font-semibold text-gray-900">ข้อมูลผู้ใช้</h3><p className="mt-0.5 text-sm text-gray-400">ชื่อที่แสดงและชื่อที่ใช้เข้าสู่ระบบ</p></div>
        </div>
        {!editing && <button type="button" onClick={() => { setFeedback(null); setEditing(true); }} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-600"><Pencil size={16} />แก้ไข</button>}
      </div>
      <fieldset disabled={!editing || busy} className="mt-5 grid gap-4 sm:grid-cols-2 disabled:opacity-100">
        <label className="block"><span className="text-sm font-medium text-gray-700">ชื่อ</span><input required maxLength={100} autoComplete="name" value={profile.displayName} onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none disabled:bg-gray-50 disabled:text-gray-700 focus:border-blue-400" /></label>
        <label className="block"><span className="text-sm font-medium text-gray-700">ชื่อผู้ใช้</span><input required minLength={3} maxLength={30} pattern="[a-z0-9._-]+" autoComplete="username" value={profile.username} onChange={(event) => setProfile({ ...profile, username: event.target.value.toLowerCase() })} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none disabled:bg-gray-50 disabled:text-gray-700 focus:border-blue-400" />{editing && <span className="mt-1 block text-xs text-gray-400">ใช้ตัวอักษรอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง</span>}</label>
      </fieldset>
      <FeedbackMessage feedback={feedback} />
      {editing && (
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" disabled={busy} onClick={cancelEdit} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-gray-600 disabled:opacity-50"><X size={16} />ยกเลิก</button>
          <button disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#356DDB] px-5 py-3 text-white disabled:opacity-50"><Save size={17} />{busyTask === "profile" ? "กำลังบันทึก..." : "บันทึก"}</button>
        </div>
      )}
    </form>
  );
}
