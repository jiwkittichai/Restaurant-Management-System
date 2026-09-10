"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { QrCode, X, Printer, ExternalLink } from "lucide-react";
type Session = { id: number; paused: boolean; billRequestedAt: string | null };
type Qr = { qr: string; url: string; tableName: string; restaurantName: string; createdAt: string };
export default function TableQr({ tableId, session, hasOrder, reload }: { tableId: number; session?: Session; hasOrder: boolean; reload: () => void }) {
  const [qr, setQr] = useState<Qr | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmRotate, setConfirmRotate] = useState(false);
  async function action(action: string) {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/table-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tableId, action }) });
      const result = await res.json(); if (!res.ok) throw new Error(result.error);
      if (["open", "show", "rotate"].includes(action)) setQr(result);
      if (action === "close") setQr(null);
      setConfirmRotate(false); reload();
    } catch (e) { setError(e instanceof Error ? e.message : "เชื่อมต่อไม่สำเร็จ"); } finally { setBusy(false); }
  }
  function print() { window.print(); }
  return <div className="mt-4 border-t border-slate-100 pt-3 space-y-2">
    {session?.billRequestedAt && <div role="status" className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900 font-medium">🔔 ลูกค้าเรียกเก็บเงิน<button disabled={busy} onClick={() => action("clear-bill")} className="block mt-1 text-xs underline">ยกเลิกการเรียก / ให้สั่งต่อ</button></div>}
    <button disabled={busy} onClick={() => action(session ? "show" : "open")} className="w-full rounded-xl bg-blue-50 text-blue-700 p-3 text-sm flex gap-2 justify-center items-center disabled:opacity-50"><QrCode size={18}/>{session ? "แสดง / พิมพ์ QR สั่งอาหาร" : "เปิดรอบโต๊ะและออก QR"}</button>
    {session && <div className="flex gap-2 text-xs"><button disabled={busy} onClick={() => action(session.paused ? "resume" : "pause")} className="flex-1 rounded-lg border p-2">{session.paused ? "เปิดรับออเดอร์ต่อ" : "พักรับออเดอร์ QR"}</button>{!hasOrder && <button disabled={busy} onClick={() => action("close")} className="rounded-lg border p-2">ปิดรอบว่าง</button>}</div>}
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {qr && createPortal(<section id="qr-order-ticket" style={{ display: "none" }}><h2>{qr.restaurantName}</h2><h1>{qr.tableName}</h1><p>{new Date(qr.createdAt).toLocaleString("th-TH")}</p><img src={qr.qr} alt="QR สั่งอาหาร"/><h2>สแกนเพื่อสั่งอาหาร</h2><p>ทุกคนสแกนและสั่งร่วมโต๊ะได้</p><p>ใช้ได้จนกว่าจะปิดบิล</p><p>ใบสำหรับสั่งอาหาร ไม่ใช่ใบเสร็จ</p></section>, document.body)}
    {qr && <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-label="QR สั่งอาหาร" className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[95dvh] overflow-y-auto text-center"><button aria-label="ปิด QR" onClick={() => setQr(null)} className="float-right p-2"><X size={20}/></button><p className="text-sm text-slate-500 clear-both">{qr.restaurantName}</p><h2 className="text-2xl font-semibold mt-2">{qr.tableName}</h2><p className="text-sm text-slate-500 mt-1">สแกนเพื่อสั่งอาหารร่วมโต๊ะ</p><img src={qr.qr} alt={`QR สั่งอาหาร ${qr.tableName}`} className="w-full max-w-[300px] mx-auto"/><p className="text-xs text-slate-500 mb-4">ใช้ได้เฉพาะรอบนี้จนกว่าจะปิดบิล</p><div className="flex gap-2"><button onClick={print} className="flex-1 bg-blue-600 text-white rounded-xl p-3 flex justify-center items-center gap-2"><Printer size={17}/>พิมพ์ใบ QR</button><a href={qr.url} target="_blank" rel="noreferrer" className="rounded-xl border p-3 flex items-center gap-2"><ExternalLink size={17}/>เปิดเมนู</a></div><p className="text-xs break-all text-slate-400 mt-3">{qr.url}</p>{confirmRotate ? <div className="bg-amber-50 p-3 rounded-xl mt-4 text-sm"><p>เครื่องที่ใช้ QR เดิมจะสั่งต่อไม่ได้ ต้องสแกนใบใหม่ ยอดบิลเดิมยังอยู่</p><button disabled={busy} onClick={() => action("rotate")} className="p-2 text-red-600 font-semibold">ยืนยันเปลี่ยน QR</button><button onClick={() => setConfirmRotate(false)} className="p-2">กลับ</button></div> : <button onClick={() => setConfirmRotate(true)} className="mt-4 text-xs underline text-slate-500">เปลี่ยน QR และยกเลิกสิทธิ์เดิม</button>}{error && <p role="alert" className="text-red-600 mt-3 text-sm">{error}</p>}</section></div>}
  </div>;
}
