"use client";

import { FormEvent, useState } from "react";
import { CircleCheck, CircleX, ShieldAlert, X } from "lucide-react";
import { jsonRequest, platformRequest } from "../_lib/api";
import type { RestaurantAction } from "../_lib/types";

const actionUi = {
  APPROVED: { title: "ยืนยันอนุมัติร้าน", description: "ร้านจะเข้าสู่สถานะเปิดใช้งาน และเข้าสู่ระบบได้", confirm: "ยืนยันอนุมัติ", icon: CircleCheck, iconTone: "bg-emerald-50 text-emerald-600", buttonTone: "bg-emerald-600 hover:bg-emerald-700" },
  REJECTED: { title: "ยืนยันปฏิเสธคำขอ", description: "ร้านจะถูกบันทึกเป็นไม่อนุมัติและยังไม่สามารถเข้าใช้งานระบบได้", confirm: "ยืนยันปฏิเสธ", icon: CircleX, iconTone: "bg-red-50 text-red-600", buttonTone: "bg-red-600 hover:bg-red-700" },
  SUSPEND: { title: "ยืนยันระงับร้าน", description: "บัญชีในร้านจะออกจากระบบและไม่สามารถเข้าใช้งานได้จนกว่าจะเปิดใช้งานอีกครั้ง", confirm: "ยืนยันระงับ", icon: ShieldAlert, iconTone: "bg-orange-50 text-orange-600", buttonTone: "bg-orange-600 hover:bg-orange-700" },
  RESUME: { title: "ยืนยันเปิดใช้งานร้าน", description: "ร้านและบัญชีผู้ใช้ภายในร้านจะกลับมาเข้าสู่ระบบได้", confirm: "ยืนยันเปิดใช้งาน", icon: CircleCheck, iconTone: "bg-emerald-50 text-emerald-600", buttonTone: "bg-emerald-600 hover:bg-emerald-700" },
};

export default function RestaurantActionModal({ action, onClose, onCompleted }: { action: RestaurantAction; onClose: () => void; onCompleted: (message: string) => void }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ui = actionUi[action.action];
  const Icon = ui.icon;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const isReview = action.action === "APPROVED" || action.action === "REJECTED";
      await platformRequest("/api/platform/restaurants", jsonRequest("PATCH", isReview
        ? { id: action.restaurant.id, decision: action.action, reason }
        : { id: action.restaurant.id, active: action.action === "RESUME", reason }));
      const messages = { APPROVED: `อนุมัติร้าน ${action.restaurant.name} แล้ว`, REJECTED: `ปฏิเสธคำขอร้าน ${action.restaurant.name} แล้ว`, SUSPEND: `ระงับร้าน ${action.restaurant.name} แล้ว`, RESUME: `เปิดใช้งานร้าน ${action.restaurant.name} แล้ว` };
      onCompleted(messages[action.action]);
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return <div className="fixed inset-0 z-[70] grid place-items-center p-4"><button type="button" aria-label="ปิดหน้าต่างยืนยัน" onClick={onClose} className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px]" /><form role="dialog" aria-modal="true" aria-labelledby="review-dialog-title" onSubmit={submit} className="relative z-10 w-full max-w-md rounded-3xl border border-gray-100 bg-white p-6 shadow-2xl shadow-slate-950/20"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-center gap-3"><span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${ui.iconTone}`}><Icon size={22} /></span><div className="min-w-0"><h2 id="review-dialog-title" className="font-semibold text-gray-900">{ui.title}</h2><p className="mt-1 truncate text-sm text-gray-500">{action.restaurant.name}</p></div></div><button type="button" disabled={busy} onClick={onClose} aria-label="ปิด" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 disabled:opacity-50"><X size={19} /></button></div><p className="mt-5 text-sm leading-6 text-gray-600">{ui.description}</p><label className="mt-5 block text-sm font-medium text-gray-700">เหตุผล <span className="font-normal text-gray-400">(ไม่บังคับ)</span><textarea maxLength={500} disabled={busy} value={reason} onChange={event => setReason(event.target.value)} placeholder="ระบุเหตุผลเพิ่มเติม" className="mt-2 block min-h-24 w-full resize-y rounded-xl border border-gray-200 p-3 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:bg-gray-50" /></label>{error && <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-600">{error}</p>}<div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">ยกเลิก</button><button disabled={busy} className={`rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-50 ${ui.buttonTone}`}>{busy ? "กำลังบันทึก..." : ui.confirm}</button></div></form></div>;
}
