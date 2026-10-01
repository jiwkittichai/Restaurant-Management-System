"use client";


import { useEffect, useState } from "react";
import { BadgeCheck, Ban, Building2, ChevronLeft, ClipboardCheck, Power, PowerOff, ShieldAlert, ShieldCheck } from "lucide-react";
type Detail = {
  restaurant: { id: number; name: string; slug: string; active: boolean; approvalStatus: string; reviewedAt: string | null; reviewReason: string | null; createdAt: string; suspendedAt: string | null; owner: { displayName: string; username: string; email: string | null; emailVerifiedAt: string | null } | null; _count: { employees: number; menuItems: number; orders: number } };
  logs: { id: number; action: string; actorName: string; createdAt: string; details: { reason?: string } | null }[];
};
export default function PlatformRestaurantDetail({ id, back }: { id: number; back: () => void }) {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [decision, setDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let alive = true;
    setData(null); setError("");
    fetch(`/api/platform/restaurants/${id}`, { cache: "no-store" }).then(async response => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "โหลดรายละเอียดไม่สำเร็จ");
      if (alive) setData(result);
    }).catch(error => { if (alive) setError(error.message); });
    return () => { alive = false; };
  }, [id, revision]);
  const date = (value: string) => new Date(value).toLocaleString("th-TH");
  const isReviewState = data?.restaurant.approvalStatus !== "APPROVED";
  const isRejected = data?.restaurant.approvalStatus === "REJECTED";
  return <section className="space-y-5">
    <button disabled={busy} onClick={back} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-blue-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50"><ChevronLeft size={18} strokeWidth={2.25} />กลับไปรายชื่อร้าน</button>
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-800">{error}</p>}
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-emerald-800">{message}</p>}
    {!data && !error && <p role="status">กำลังโหลดรายละเอียดร้าน...</p>}
    {!data && error && <button className="underline" onClick={() => setRevision(value => value + 1)}>ลองอีกครั้ง</button>}
    {data && <>
      <article className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Building2 size={21} strokeWidth={2} /></span><div className="min-w-0"><h2 className="truncate text-xl font-semibold">{data.restaurant.name}</h2><p className="mt-1 break-words text-sm text-slate-500">รหัสร้าน #{id} · {data.restaurant.slug}</p></div></div><span className={`rounded-full px-3 py-1 text-sm font-medium ${data.restaurant.approvalStatus === "PENDING" ? "bg-amber-50 text-amber-800" : data.restaurant.approvalStatus === "REJECTED" || !data.restaurant.active ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-800"}`}>{data.restaurant.approvalStatus === "PENDING" ? "รออนุมัติ" : data.restaurant.approvalStatus === "REJECTED" ? "ไม่อนุมัติ" : data.restaurant.active ? "เปิดใช้งาน" : "ระงับ"}</span></div>
        <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[["ผลการตรวจสอบ", data.restaurant.reviewReason || "ยังไม่มีผลการตรวจสอบ"], ["วันที่ตรวจสอบ", data.restaurant.reviewedAt ? date(data.restaurant.reviewedAt) : "—"], ["วันที่สมัคร", date(data.restaurant.createdAt)], ["เจ้าของร้าน", data.restaurant.owner?.displayName || "ไม่ระบุ"], ["ชื่อผู้ใช้เจ้าของ", data.restaurant.owner?.username || "ไม่ระบุ"], ["อีเมลเจ้าของ", data.restaurant.owner?.email || "ยังไม่มีอีเมล"], ["สถานะอีเมล", data.restaurant.owner?.emailVerifiedAt ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"], ["วันที่ระงับ", data.restaurant.suspendedAt ? date(data.restaurant.suspendedAt) : "—"]].map(([label, value]) => <div key={label} className="rounded-xl bg-gray-50 p-4"><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-2 break-words text-sm font-medium text-gray-900">{value}</dd></div>)}
        </dl>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">{[["บัญชีผู้ใช้ในร้าน", data.restaurant._count.employees], ["เมนู", data.restaurant._count.menuItems], ["ออเดอร์สะสม", data.restaurant._count.orders]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-2xl font-semibold">{Number(value).toLocaleString("th-TH")}</p></div>)}</div>
      </article>
      <article className={`rounded-2xl border bg-white p-5 sm:p-6 ${isReviewState ? isRejected ? "border-red-100" : "border-blue-100" : "border-gray-100"}`}>
        <div className="flex items-start gap-3">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${isReviewState ? isRejected ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600" : data.restaurant.active ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
            {isReviewState ? isRejected ? <Ban size={21} strokeWidth={2} /> : <ClipboardCheck size={21} strokeWidth={2} /> : data.restaurant.active ? <ShieldCheck size={21} strokeWidth={2} /> : <ShieldAlert size={21} strokeWidth={2} />}
          </span>
          <div>
            <h2 className="font-semibold text-gray-900">{isReviewState ? isRejected ? "จัดการคำขอที่ไม่อนุมัติ" : "ตรวจสอบคำขอสมัครร้าน" : "จัดการสถานะร้าน"}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{isReviewState ? isRejected ? "สามารถตรวจสอบข้อมูลอีกครั้งและอนุมัติร้านภายหลังได้" : "ตรวจสอบข้อมูลร้านและเจ้าของ แล้วเลือกผลการพิจารณาได้ทันที" : data.restaurant.active ? "การระงับจะนำทุกบัญชีออกจากระบบและปิด QR รอบโต๊ะ โดยยังเก็บข้อมูลและบิลไว้" : "เปิดร้านคืนแล้ว เจ้าของและพนักงานต้องเข้าสู่ระบบใหม่"}</p>
          </div>
        </div>

        {!editing ? isReviewState ? <div className={`mt-5 grid gap-3 ${isRejected ? "sm:max-w-sm" : "sm:grid-cols-2"}`}>
          <button type="button" onClick={() => { setDecision("APPROVED"); setEditing(true); setMessage(""); setReason(""); }} className="group rounded-xl bg-emerald-600 p-4 text-left text-white shadow-sm shadow-emerald-100 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-100"><span className="flex items-center gap-2 font-semibold"><BadgeCheck size={20} strokeWidth={2.25} />อนุมัติร้าน</span></button>
          {!isRejected && <button type="button" onClick={() => { setDecision("REJECTED"); setEditing(true); setMessage(""); setReason(""); }} className="group rounded-xl border border-red-200 bg-red-50 p-4 text-left text-red-700 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100 hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-red-50"><span className="flex items-center gap-2 font-semibold"><Ban size={20} strokeWidth={2.25} />ปฏิเสธคำขอ</span></button>}
        </div> : <button type="button" onClick={() => { setEditing(true); setMessage(""); setReason(""); }} className={`mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 ${data.restaurant.active ? "bg-red-600 text-white shadow-red-100 hover:bg-red-700 focus:ring-red-100" : "bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700 focus:ring-emerald-100"}`}>{data.restaurant.active ? <><PowerOff size={18} strokeWidth={2.25} />ระงับร้าน</> : <><Power size={18} strokeWidth={2.25} />เปิดใช้งานร้าน</>}</button> : <form className="mt-5 space-y-4 rounded-xl bg-gray-50 p-4 sm:p-5" onSubmit={async event => {
          event.preventDefault(); if (busy) return;
          setBusy(true); setError(""); setMessage("");
          try {
            const response = await fetch("/api/platform/restaurants", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(isReviewState ? { id, decision, reason } : { id, active: !data.restaurant.active, reason }) });
            const result = await response.json(); if (!response.ok) throw new Error(result.error || "บันทึกไม่สำเร็จ");
            setEditing(false); setReason(""); setMessage(isReviewState ? decision === "APPROVED" ? "อนุมัติร้านแล้ว" : "ปฏิเสธคำขอร้านแล้ว" : data.restaurant.active ? "ระงับร้านแล้ว" : "เปิดใช้งานร้านแล้ว"); setRevision(value => value + 1);
          } catch (error) { setError(error instanceof Error ? error.message : "เชื่อมต่อไม่สำเร็จ"); } finally { setBusy(false); }
        }}>
          {isReviewState && <div role="status" className={`flex items-center gap-2 rounded-xl p-3 text-sm font-medium ${decision === "APPROVED" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{decision === "APPROVED" ? <BadgeCheck size={18} /> : <Ban size={18} />}{decision === "APPROVED" ? "กำลังอนุมัติร้านนี้" : "กำลังปฏิเสธคำขอนี้"}</div>}
          <label className="block text-sm font-medium text-gray-700">เหตุผล <span className="font-normal text-gray-400">(ไม่บังคับ)</span><textarea maxLength={500} disabled={busy} value={reason} onChange={event => setReason(event.target.value)} placeholder={decision === "APPROVED" ? "เช่น ตรวจสอบข้อมูลครบถ้วนแล้ว" : "ระบุเหตุผลที่ไม่อนุมัติ เพื่อใช้อ้างอิงภายหลัง"} className="mt-2 block min-h-24 w-full resize-y rounded-xl border border-gray-200 bg-white p-3 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50" /></label>
          <div className="flex flex-col-reverse gap-3 sm:flex-row"><button type="button" disabled={busy} onClick={() => { setEditing(false); setReason(""); }} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">ยกเลิก</button><button disabled={busy} className={`rounded-xl px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${isReviewState && decision === "APPROVED" || !isReviewState && !data.restaurant.active ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}`}>{busy ? "กำลังบันทึก..." : isReviewState ? decision === "APPROVED" ? "ยืนยันอนุมัติร้าน" : "ยืนยันปฏิเสธคำขอ" : data.restaurant.active ? "ยืนยันระงับร้าน" : "ยืนยันเปิดใช้งานร้าน"}</button></div>
        </form>}
      </article>
      <article className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6"><h2 className="font-semibold">ประวัติสถานะร้าน · ล่าสุด 20 รายการ</h2>{!data.logs.length && <p className="mt-4 rounded-xl bg-gray-50 p-4 text-sm text-slate-500">ยังไม่มีประวัติการตรวจสอบหรือเปลี่ยนสถานะ</p>}{data.logs.map(log => <div key={log.id} className="mt-4 border-t border-slate-100 pt-4"><p className="font-medium">{log.action === "RESTAURANT_APPROVED" ? "อนุมัติร้าน" : log.action === "RESTAURANT_REJECTED" ? "ปฏิเสธคำขอร้าน" : log.action === "RESTAURANT_SUSPENDED" ? "ระงับร้าน" : "เปิดร้านอีกครั้ง"} · {log.actorName}</p><p className="mt-1 text-sm text-slate-500">{date(log.createdAt)}</p><p className="mt-2 break-words text-sm text-gray-700">เหตุผล: {log.details?.reason || "ไม่ระบุ"}</p></div>)}</article>
    </>}
  </section>;
}
