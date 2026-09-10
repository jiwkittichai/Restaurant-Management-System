"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Utensils, ShoppingBag, Search, Plus, Minus, X, CheckCircle2, BellRing, ChefHat } from "lucide-react";

type Option = { id: number; name: string; price: number };
type Group = { id: number; name: string; minSelect: number; maxSelect: number; options: Option[] };
type Menu = { id: number; name: string; description: string | null; price: number; image: string | null; available: boolean; category: { id: number; name: string }; modifierGroups: Group[] };
type Line = { key: string; menu: Menu; qty: number; note: string; modifierIds: number[] };
type Item = { id: number; name: string; qty: number; price: number; status: string; mine: boolean; note: string | null; modifiers: { name: string }[] };
type Data = { restaurantName: string; tableName: string; paused: boolean; billRequestedAt: string | null; menu: Menu[]; order: { total: number; subtotal: number; discount: number; items: Item[] } | null };
const money = (n: number) => `฿${n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const statuses: Record<string, string> = { NEW: "ส่งเข้าครัวแล้ว", PREPARING: "กำลังทำ", READY: "พร้อมเสิร์ฟ", SERVED: "เสิร์ฟแล้ว" };
// Works over LAN HTTP as well as HTTPS (crypto.randomUUID requires a secure context).
function newId() { return Array.from(crypto.getRandomValues(new Uint8Array(20)), b => b.toString(16).padStart(2, "0")).join(""); }
function price(line: Line) { return line.menu.price + line.menu.modifierGroups.flatMap(g => g.options).filter(o => line.modifierIds.includes(o.id)).reduce((s, o) => s + o.price, 0); }

export default function GuestOrder({ token }: { token: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [guest, setGuest] = useState("");
  const [closed, setClosed] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<"menu" | "mine" | "table">("menu");
  const [category, setCategory] = useState(0);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Line[]>([]);
  const [editing, setEditing] = useState<Line | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const pending = useRef<{ requestId: string; fingerprint: string } | null>(null);
  const storageKey = `qr-table-${token}`;
  useEffect(() => {
    let id = newId();
    try {
      id = localStorage.getItem(`${storageKey}-guest`) || id;
      localStorage.setItem(`${storageKey}-guest`, id);
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved) { setCart(saved.cart || []); pending.current = saved.pending || null; }
    } catch { /* Storage unavailable: ordering still works for this page. */ }
    setGuest(id);
  }, [storageKey]);
  const load = useCallback(async () => {
    if (!guest) return;
    try {
      const res = await fetch(`/api/guest/${token}?guestId=${guest}`, { cache: "no-store" });
      const result = await res.json();
      if (res.status === 410) { setClosed(true); setData(null); return; }
      if (!res.ok) throw new Error(result.error);
      setData(result);
    } catch { setMessage("เชื่อมต่อร้านไม่สำเร็จ กำลังลองเชื่อมต่อใหม่"); }
  }, [guest, token]);
  useEffect(() => { load(); const timer = setInterval(load, 5000); return () => clearInterval(timer); }, [load]);
  useEffect(() => { if (guest) try { localStorage.setItem(storageKey, JSON.stringify({ cart, pending: pending.current })); } catch {} }, [cart, guest, storageKey]);
  const blocked = closed || !!data?.paused || !!data?.billRequestedAt;
  const total = cart.reduce((s, l) => s + price(l) * l.qty, 0);
  function select(option: Option, group: Group) {
    if (!editing) return;
    const selected = editing.modifierIds.includes(option.id);
    const groupIds = group.options.map(o => o.id);
    let ids = editing.modifierIds.filter(id => !selected || id !== option.id);
    if (!selected) {
      if (group.maxSelect === 1) ids = ids.filter(id => !groupIds.includes(id));
      else if (ids.filter(id => groupIds.includes(id)).length >= group.maxSelect) { setMessage(`เลือก ${group.name} ได้ไม่เกิน ${group.maxSelect} ตัวเลือก`); return; }
      ids.push(option.id);
    }
    setEditing({ ...editing, modifierIds: ids });
  }
  function saveLine() {
    if (!editing) return;
    for (const group of editing.menu.modifierGroups) {
      const count = group.options.filter(o => editing.modifierIds.includes(o.id)).length;
      if (count < group.minSelect || count > group.maxSelect) { setMessage(`กรุณาเลือก ${group.name} ${group.minSelect}–${group.maxSelect} ตัวเลือก`); return; }
    }
    setCart(lines => [...lines.filter(l => l.key !== editing.key), editing]); setEditing(null); setMessage("");
  }
  async function submit() {
    if (sending.current || blocked || !cart.length) return;
    sending.current = true; setBusy(true); setMessage("");
    const items = cart.map(l => ({ menuItemId: l.menu.id, qty: l.qty, note: l.note, modifierIds: l.modifierIds }));
    const fingerprint = JSON.stringify(items);
    if (!pending.current || pending.current.fingerprint !== fingerprint) pending.current = { requestId: newId(), fingerprint };
    try { localStorage.setItem(storageKey, JSON.stringify({ cart, pending: pending.current })); } catch {}
    try {
      const response = await fetch(`/api/guest/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, guestId: guest, requestId: pending.current.requestId }) });
      const result = await response.json();
      if (!response.ok) { if (response.status === 410) setClosed(true); throw new Error(result.error); }
      pending.current = null; setCart([]); setShowCart(false); setTab("mine"); setMessage("ส่งอาหารเข้าครัวแล้ว สั่งเพิ่มได้จากหน้าเมนู"); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "ยังยืนยันผลไม่ได้ กดส่งอีกครั้งเพื่อตรวจสอบรายการเดิม"); }
    finally { sending.current = false; setBusy(false); }
  }
  async function requestBill() {
    setBusy(true);
    try {
      const res = await fetch(`/api/guest/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bill" }) });
      const result = await res.json(); if (!res.ok) throw new Error(result.error);
      setMessage("แจ้งพนักงานแล้ว กรุณารอชำระเงินที่โต๊ะ"); await load();
    } catch (e) { setMessage(e instanceof Error ? e.message : "เชื่อมต่อไม่สำเร็จ"); } finally { setBusy(false); }
  }
  if (closed) return <main className="min-h-dvh bg-slate-50 grid place-items-center p-6"><div className="max-w-sm rounded-3xl bg-white p-8 text-center shadow-sm"><CheckCircle2 className="mx-auto mb-4 text-emerald-600" size={48}/><h1 className="text-2xl font-semibold">รอบโต๊ะนี้สิ้นสุดแล้ว</h1><p className="mt-3 text-slate-500">หากต้องการสั่งอาหาร กรุณาขอ QR รอบปัจจุบันจากพนักงาน</p></div></main>;
  if (!data) return <main className="min-h-dvh grid place-items-center bg-slate-50 p-6"><p role="status">{message || "กำลังเปิดเมนูของโต๊ะ…"}</p></main>;
  const categories = [...new Map(data.menu.map(m => [m.category.id, m.category])).values()];
  return <main className="min-h-dvh bg-[#f6f7fb] text-slate-800 pb-32">
    <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur"><div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center gap-3"><div><p className="text-xs text-slate-500">ยินดีต้อนรับ · สั่งอาหารร่วมโต๊ะ</p><h1 className="text-xl font-semibold">{data.restaurantName}</h1></div><span className="rounded-2xl bg-blue-50 px-4 py-2 text-blue-700 font-semibold">{data.tableName}</span></div><nav className="max-w-3xl mx-auto flex px-4 gap-4">{([["menu", "เมนูอาหาร"], ["mine", "รายการที่ฉันสั่ง"], ["table", "รายการทั้งโต๊ะ"]] as const).map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`py-3 text-sm border-b-2 ${tab === key ? "border-blue-600 text-blue-600 font-semibold" : "border-transparent text-slate-500"}`}>{label}</button>)}</nav></header>
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      {message && <div role="status" className="rounded-2xl bg-blue-50 p-4 text-sm text-blue-800 flex justify-between gap-3">{message}<button aria-label="ปิดข้อความ" onClick={() => setMessage("")}><X size={18}/></button></div>}
      {blocked && <p className="rounded-2xl bg-amber-50 p-4 text-amber-800 text-sm">{data.billRequestedAt ? "เรียกเก็บเงินแล้ว พักรับรายการเพิ่มระหว่างรอชำระเงิน" : "ร้านพักรับรายการของโต๊ะนี้ชั่วคราว กรุณาติดต่อพนักงาน"}</p>}
      {tab === "menu" ? <>
        <div className="relative"><Search className="absolute left-4 top-3.5 text-slate-400" size={20}/><input aria-label="ค้นหาอาหาร" value={search} onChange={e => setSearch(e.target.value)} placeholder="วันนี้อยากทานอะไร?" className="w-full bg-white rounded-2xl p-3 pl-12 border border-slate-200 outline-none focus:border-blue-500"/></div>
        <div className="flex gap-2 overflow-x-auto pb-1">{[{ id: 0, name: "ทั้งหมด" }, ...categories].map(c => <button key={c.id} onClick={() => setCategory(c.id)} className={`shrink-0 rounded-full px-4 py-2 text-sm ${category === c.id ? "bg-slate-900 text-white" : "bg-white border border-slate-200"}`}>{c.name}</button>)}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{data.menu.filter(m => (!category || m.category.id === category) && m.name.includes(search)).map(m => <button disabled={blocked || !m.available} key={m.id} onClick={() => { setMessage(""); setEditing({ key: newId(), menu: m, qty: 1, note: "", modifierIds: [] }); }} className="text-left bg-white rounded-2xl overflow-hidden border border-slate-100 disabled:opacity-50"><div className="aspect-[4/3] bg-slate-100 flex items-center justify-center">{m.image ? <img src={m.image} referrerPolicy="no-referrer" alt={m.name} className="h-full w-full object-cover"/> : <Utensils size={32} className="text-slate-300"/>}</div><div className="p-3"><p className="text-xs text-slate-400 mb-1">{m.category.name}</p><h2 className="font-medium">{m.name}</h2><div className="mt-3 flex justify-between items-center"><span className="text-blue-700 font-semibold">{money(m.price)}</span>{m.available ? <Plus size={22} className="bg-blue-50 rounded-full p-1"/> : <span className="text-xs text-red-600">หมดชั่วคราว</span>}</div></div></button>)}</div>
        {!data.menu.filter(m => (!category || m.category.id === category) && m.name.includes(search)).length && <p className="py-12 text-center text-slate-500">ไม่พบเมนูอาหาร</p>}
      </> : <>
        <div className="rounded-2xl bg-slate-900 p-5 text-white"><p className="text-sm text-slate-300">{tab === "mine" ? "ยอดรายการจากเครื่องนี้ (ก่อนส่วนลด)" : "ยอดรวมทั้งโต๊ะ"}</p><p className="text-3xl font-semibold mt-2">{money(tab === "mine" ? (data.order?.items.filter(i => i.mine).reduce((s, i) => s + i.price * i.qty, 0) || 0) : data.order?.total || 0)}</p><p className="mt-2 text-xs text-slate-300">รวมชำระเป็นบิลเดียว · ต้องการยกเลิกรายการ กรุณาติดต่อพนักงาน</p></div>
        {(data.order?.items || []).filter(i => tab === "table" || i.mine).map(i => <article key={i.id} className="rounded-2xl bg-white p-4 border border-slate-100"><div className="flex justify-between gap-3"><h2 className="font-medium">{i.qty} × {i.name}</h2><span>{money(i.qty * i.price)}</span></div><p className="text-sm text-slate-500 mt-1">{i.modifiers.map(m => m.name).join(" · ")}{i.note ? ` · ${i.note}` : ""}</p><span className="mt-3 inline-flex gap-2 items-center bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-xs"><ChefHat size={14}/>{statuses[i.status] || i.status}</span></article>)}
        {!(data.order?.items || []).some(i => tab === "table" || i.mine) && <p className="text-center py-8 text-slate-500">ยังไม่มีรายการที่ส่ง</p>}
        {tab === "table" && !!data.order?.items.length && <button disabled={busy || !!data.billRequestedAt} onClick={requestBill} className="w-full border border-blue-200 rounded-2xl p-4 text-blue-700 bg-white disabled:opacity-50 flex justify-center items-center gap-2"><BellRing size={18}/>{data.billRequestedAt ? "แจ้งเรียกเก็บเงินแล้ว" : "เรียกเก็บเงินทั้งโต๊ะ"}</button>}
      </>}
    </div>
    {!!cart.length && !showCart && <div className="fixed bottom-0 inset-x-0 z-30 p-4 bg-gradient-to-t from-[#f6f7fb] to-transparent"><button onClick={() => setShowCart(true)} className="max-w-3xl mx-auto w-full flex justify-between bg-blue-600 text-white rounded-2xl p-4 shadow-lg"><span className="flex gap-2"><ShoppingBag size={20}/>ดูตะกร้า · {cart.reduce((s, l) => s + l.qty, 0)} รายการ</span><b>{money(total)}</b></button></div>}
    {(editing || showCart) && <div className="fixed inset-0 z-40 bg-black/40 flex items-end sm:items-center justify-center sm:p-4"><section role="dialog" aria-modal="true" aria-label={editing ? "เลือกอาหาร" : "ตรวจตะกร้า"} className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 max-h-[90dvh] overflow-y-auto"><div className="flex justify-between items-center mb-4"><h2 className="text-xl font-semibold">{editing ? editing.menu.name : "ตรวจรายการก่อนสั่ง"}</h2><button disabled={busy} aria-label="ปิด" onClick={() => { setEditing(null); setShowCart(false); }} className="p-2 bg-slate-100 rounded-full"><X size={20}/></button></div>
      {message && <p role="alert" className="bg-amber-50 text-amber-800 p-3 rounded-xl mb-3 text-sm">{message}</p>}
      {editing ? <><p className="text-slate-500 text-sm mb-4">{editing.menu.description}</p>{editing.menu.modifierGroups.map(g => <fieldset key={g.id} className="mb-5"><legend className="font-medium mb-2">{g.name} <span className="text-xs text-slate-400">เลือก {g.minSelect}–{g.maxSelect}</span></legend><div className="space-y-2">{g.options.map(o => <label key={o.id} className="flex items-center gap-3 border rounded-xl p-3"><input type="checkbox" checked={editing.modifierIds.includes(o.id)} onChange={() => select(o, g)}/><span className="flex-1">{o.name}</span><span className="text-sm text-slate-500">+{money(o.price)}</span></label>)}</div></fieldset>)}<label className="block text-sm">หมายเหตุ<input maxLength={500} value={editing.note} onChange={e => setEditing({ ...editing, note: e.target.value })} placeholder="เช่น ไม่ใส่ผัก" className="mt-2 w-full border rounded-xl p-3"/></label><div className="flex items-center justify-center gap-6 my-5"><button aria-label="ลดจำนวน" disabled={editing.qty <= 1} onClick={() => setEditing({ ...editing, qty: editing.qty - 1 })} className="p-3 rounded-full bg-slate-100 disabled:opacity-30"><Minus size={18}/></button><b>{editing.qty}</b><button aria-label="เพิ่มจำนวน" disabled={editing.qty >= 50} onClick={() => setEditing({ ...editing, qty: editing.qty + 1 })} className="p-3 rounded-full bg-slate-100"><Plus size={18}/></button></div><button onClick={saveLine} className="w-full bg-blue-600 text-white rounded-xl p-4">เพิ่มลงตะกร้า · {money(price(editing) * editing.qty)}</button></> : <><p className="text-sm text-slate-500 mb-4">รายการจะส่งเข้าครัวทันทีหลังยืนยัน</p>{cart.map(l => <div key={l.key} className="py-3 border-b"><div className="flex justify-between gap-3"><button disabled={busy} className="text-left" onClick={() => setEditing(l)}>{l.qty} × {l.menu.name}<span className="block text-xs text-slate-400 mt-1">{l.menu.modifierGroups.flatMap(g => g.options).filter(o => l.modifierIds.includes(o.id)).map(o => o.name).join(" · ")} {l.note}</span><span className="text-xs text-blue-600">แก้ไข</span></button><div className="text-right">{money(price(l) * l.qty)}<button disabled={busy} aria-label={`ลบ ${l.menu.name}`} onClick={() => setCart(c => c.filter(i => i.key !== l.key))} className="block ml-auto p-2 text-red-500"><X size={16}/></button></div></div></div>)}<div className="flex justify-between font-semibold text-lg my-5"><span>รวมรายการนี้</span><span>{money(total)}</span></div><button disabled={busy || blocked || !cart.length} onClick={submit} className="w-full bg-blue-600 text-white rounded-xl p-4 disabled:opacity-40">{busy ? "กำลังส่ง…" : blocked ? "โต๊ะพักรับรายการ" : "ยืนยันสั่งอาหาร"}</button></>}
    </section></div>}
  </main>;
}
