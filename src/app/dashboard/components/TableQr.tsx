"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { QrCode, X, Printer, ExternalLink } from "lucide-react";
type Session = { id: number; paused: boolean; billRequestedAt: string | null };
import type { RestaurantBrand } from "@/lib/restaurant-brand";
type Qr = { brand: RestaurantBrand; qr: string; url: string; tableName: string; restaurantName: string; createdAt: string };
export default function TableQr({ tableId, session, hasOrder, reload }: { tableId: number; session?: Session; hasOrder: boolean; reload: () => void }) {
  const [qr, setQr] = useState<Qr | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function action(action: string) {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/table-sessions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tableId, action }) });
      const result = await res.json(); if (!res.ok) throw new Error(result.error);
      if (["open", "show"].includes(action)) setQr(result);
      if (action === "close") setQr(null);
      reload();
    } catch (e) { setError(e instanceof Error ? e.message : "เชื่อมต่อไม่สำเร็จ"); } finally { setBusy(false); }
  }
  function print() { window.print(); }
  return <div className="mt-4 border-t border-slate-100 pt-3 space-y-2">
    {session?.billRequestedAt && <div role="status" className="rounded-xl bg-amber-100 p-3 text-sm text-amber-900 font-medium">🔔 ลูกค้าเรียกเก็บเงิน<button disabled={busy} onClick={() => action("clear-bill")} className="block mt-1 text-xs underline">ยกเลิกเช็คบิล / ให้สั่งต่อ</button></div>}
    <div className="flex items-stretch gap-2">
      <button type="button" disabled={busy} onClick={() => action(session ? "show" : "open")} className="min-h-11 min-w-0 flex-1 rounded-xl bg-blue-50 text-blue-700 px-3 py-2.5 text-sm flex gap-2 justify-center items-center transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"><QrCode size={18} className="shrink-0"/><span>{session ? "แสดง / พิมพ์ QR สั่งอาหาร" : "เปิดรอบโต๊ะและออก QR"}</span></button>
      {session && !hasOrder && <button type="button" disabled={busy} onClick={() => action("close")} title="ปิดรอบโต๊ะที่ยังไม่มีออเดอร์" aria-label="ปิดรอบโต๊ะที่ยังไม่มีออเดอร์" className="w-11 min-h-11 shrink-0 rounded-xl bg-red-50 text-red-500 grid place-items-center transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-50"><X size={18}/></button>}
    </div>
    {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    {qr && createPortal(<section id="qr-order-ticket" style={{ display: "none" }}>{qr.brand.logoUrl && <img src={qr.brand.logoUrl} alt="โลโก้ร้าน" style={{width:"18mm",height:"18mm",objectFit:"contain"}}/>}<h2>{qr.restaurantName}</h2><h1>{qr.tableName}</h1><p>{new Date(qr.createdAt).toLocaleString("th-TH")}</p><img src={qr.qr} alt="QR สั่งอาหาร"/><h2>สแกนเพื่อสั่งอาหาร</h2><p>ทุกคนสแกนและสั่งร่วมโต๊ะได้</p><p>ใบสำหรับสั่งอาหาร ไม่ใช่ใบเสร็จ</p>{qr.brand.receiptFooter && <p style={{whiteSpace:"pre-wrap"}}>{qr.brand.receiptFooter}</p>}</section>, document.body)}
    {qr && <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" aria-label="QR สั่งอาหาร" className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[95dvh] overflow-y-auto text-center"><button aria-label="ปิด QR" onClick={() => setQr(null)} className="float-right p-2"><X size={20}/></button>{qr.brand.logoUrl && <img src={qr.brand.logoUrl} alt="โลโก้ร้าน" className="clear-both w-16 h-16 object-contain mx-auto mb-2"/>}<p className="text-sm text-slate-500 clear-both break-words">{qr.restaurantName}</p><h2 className="text-2xl font-semibold mt-2">{qr.tableName}</h2><p className="text-sm text-slate-500 mt-1">สแกนเพื่อสั่งอาหารร่วมโต๊ะ</p><img src={qr.qr} alt={`QR สั่งอาหาร ${qr.tableName}`} className="w-full max-w-[300px] mx-auto"/><div className="flex gap-2"><button onClick={print} className="flex-1 bg-blue-600 text-white rounded-xl p-3 flex justify-center items-center gap-2"><Printer size={17}/>พิมพ์ใบ QR</button><a href={qr.url} target="_blank" rel="noreferrer" className="rounded-xl border p-3 flex items-center gap-2"><ExternalLink size={17}/>เปิดเมนู</a></div>{error && <p role="alert" className="text-red-600 mt-3 text-sm">{error}</p>}</section></div>}
  </div>;
}
