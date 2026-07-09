"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Minus, Plus, Search, ShoppingBag, Trash2, Utensils, Package } from "lucide-react";

type Menu = { id:number; name:string; price:number; saleUnit:string; image?:string; available:boolean; sellable:boolean; stockTracked:boolean; maxServings:number|null; category:{ id:number; name:string } };
type ActiveOrder = { id:number; orderNumber:string; subtotal:number; discount:number; total:number; status:string; paymentStatus:string; items:Array<{id:number;name:string;qty:number;price:number;status:string}> };
type Table = { id:number; name:string; status:string; orders:ActiveOrder[] };
type Cart = Menu & { qty:number; note:string };
type OrderType = "DINE_IN" | "TAKEAWAY";

export default function OrdersPage() {
  const [menu,setMenu]=useState<Menu[]>([]);const [tables,setTables]=useState<Table[]>([]);const [cart,setCart]=useState<Cart[]>([]);
  const [category,setCategory]=useState<number|"all">("all");const [orderType,setOrderType]=useState<OrderType>("DINE_IN");
  const [tableId,setTableId]=useState("");const [customerName,setCustomerName]=useState("");const [customerPhone,setCustomerPhone]=useState("");
  const [search,setSearch]=useState("");const [discount,setDiscount]=useState("0");const [note,setNote]=useState("");const [message,setMessage]=useState("");const [loading,setLoading]=useState(false);
  const load=useCallback(()=>Promise.all([fetch("/api/menu").then(r=>r.json()),fetch("/api/tables").then(r=>r.json())]).then(([m,t])=>{setMenu(m);setTables(t);}),[]);
  useEffect(()=>{load();},[load]);

  const categories=useMemo(()=>[...new Map(menu.map(i=>[i.category.id,i.category])).values()],[menu]);
  const selectedTable=tables.find(table=>table.id===Number(tableId));const activeOrder=selectedTable?.orders[0];
  const filtered=menu.filter(i=>(category==="all"||i.category.id===category)&&i.name.toLowerCase().includes(search.toLowerCase()));
  const subtotal=cart.reduce((sum,item)=>sum+item.price*item.qty,0);const total=Math.max(0,subtotal-Number(discount||0));
  const combinedTotal=activeOrder?activeOrder.total+subtotal:total;
  function unit(item:Menu){return item.saleUnit||"จาน";}
  function add(item:Menu){if(!item.sellable)return;const found=cart.find(i=>i.id===item.id);if(found&&item.maxServings!==null&&found.qty>=item.maxServings){setMessage(`${item.name} เหลือขายได้ ${item.maxServings} ${unit(item)}`);return;}setCart(prev=>found?prev.map(i=>i.id===item.id?{...i,qty:i.qty+1}:i):[...prev,{...item,qty:1,note:""}]);}
  function quantity(id:number,delta:number){const item=cart.find(i=>i.id===id);if(item&&delta>0&&item.maxServings!==null&&item.qty+delta>item.maxServings){setMessage(`${item.name} เหลือขายได้ ${item.maxServings} ${unit(item)}`);return;}setCart(prev=>prev.map(i=>i.id===id?{...i,qty:i.qty+delta}:i).filter(i=>i.qty>0));}
  function changeType(type:OrderType){setOrderType(type);setMessage("");if(type==="TAKEAWAY")setTableId("");}

  async function submit(){
    if(!cart.length)return setMessage("กรุณาเลือกเมนูอาหาร");
    if(orderType==="DINE_IN"&&!tableId)return setMessage("กรุณาเลือกโต๊ะอาหาร");
    setLoading(true);setMessage("");
    const res=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      type:orderType,tableId:orderType==="DINE_IN"?Number(tableId):undefined,customerName,customerPhone,
      items:cart.map(i=>({menuItemId:i.id,qty:i.qty,note:i.note})),discount:activeOrder?0:Number(discount||0),note,
    })});
    const data=await res.json();setLoading(false);if(!res.ok)return setMessage(data.error);
    setMessage(orderType==="TAKEAWAY"?`สร้างคิว ${data.queueNumber} และส่งเข้าครัวแล้ว`:data.isAdditional?`เพิ่มรายการในบิล ${data.orderNumber} แล้ว`:`ส่งออเดอร์ ${data.orderNumber} เข้าครัวแล้ว`);
    setCart([]);setTableId("");setCustomerName("");setCustomerPhone("");setDiscount("0");setNote("");load();
  }

  return <div className="p-4 lg:p-6 grid xl:grid-cols-[1fr_380px] gap-5 h-full overflow-hidden">
    <section className="overflow-y-auto pr-1">
      <div className="relative mb-4"><Search className="absolute left-4 top-3.5 text-gray-400" size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาเมนูอาหาร" className="w-full bg-white rounded-xl py-3 pl-11 pr-4 outline-none"/></div>
      <div className="flex gap-2 overflow-x-auto pb-4"><button onClick={()=>setCategory("all")} className={`px-4 py-2 rounded-full whitespace-nowrap text-sm ${category==="all"?"bg-[#356DDB] text-white":"bg-white text-gray-500"}`}>ทั้งหมด</button>{categories.map(c=><button key={c.id} onClick={()=>setCategory(c.id)} className={`px-4 py-2 rounded-full whitespace-nowrap text-sm ${category===c.id?"bg-[#356DDB] text-white":"bg-white text-gray-500"}`}>{c.name}</button>)}</div>
      <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-4 gap-4">{filtered.map(item=><button key={item.id} disabled={!item.sellable} onClick={()=>add(item)} className={`relative bg-white text-left rounded-2xl border p-3 transition ${item.sellable?"border-gray-100 hover:shadow-md":"border-red-100 opacity-60 cursor-not-allowed"}`}><span className={`absolute z-10 top-5 right-5 px-2.5 py-1 rounded-full text-[11px] font-medium shadow-sm ${!item.available||item.maxServings===0?"bg-red-500 text-white":item.stockTracked&&item.maxServings!==null&&item.maxServings<=5?"bg-amber-400 text-amber-950":"bg-white/90 text-gray-500"}`}>{!item.available?"ปิดขาย":item.maxServings===0?"หมด":item.stockTracked?`เหลือ ${item.maxServings} ${unit(item)}`:"ไม่ติดตามสต็อก"}</span><div className="aspect-[4/3] rounded-xl bg-gray-100 overflow-hidden mb-3">{item.image?<img src={item.image} alt={item.name} className="w-full h-full object-cover object-center"/>:<div className="w-full h-full grid place-items-center text-gray-300"><ShoppingBag/></div>}</div><p className="font-medium truncate">{item.name}</p><div className="flex justify-between mt-1"><span className="text-xs text-gray-400">{item.category.name}</span><span className="text-blue-600 font-semibold">฿{item.price.toFixed(2)}</span></div></button>)}</div>
      {!filtered.length&&<p className="text-center text-gray-400 mt-16">ยังไม่มีเมนูพร้อมขาย</p>}
    </section>
    <aside className="bg-white rounded-3xl border border-gray-100 p-5 flex flex-col overflow-hidden">
      <h2 className="font-semibold text-lg">รายการออเดอร์</h2>
      <div className="grid grid-cols-2 gap-2 mt-3"><button onClick={()=>changeType("DINE_IN")} className={`py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 ${orderType==="DINE_IN"?"bg-[#212A3A] text-white":"bg-gray-100 text-gray-500"}`}><Utensils size={16}/> ทานที่ร้าน</button><button onClick={()=>changeType("TAKEAWAY")} className={`py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 ${orderType==="TAKEAWAY"?"bg-[#356DDB] text-white":"bg-gray-100 text-gray-500"}`}><Package size={16}/> ซื้อกลับบ้าน</button></div>
      {orderType==="DINE_IN"?<><select value={tableId} onChange={e=>{setTableId(e.target.value);setMessage("");}} className="mt-3 border border-gray-200 rounded-xl px-3 py-2.5 bg-white"><option value="">เลือกโต๊ะอาหาร</option>{tables.filter(t=>["AVAILABLE","OCCUPIED"].includes(t.status)).map(t=><option key={t.id} value={t.id}>{t.name}{t.orders[0]?` · เพิ่มในบิล ${t.orders[0].orderNumber}`:""}</option>)}</select>{activeOrder&&<div className="mt-2 rounded-xl bg-amber-50 border border-amber-100 p-3"><p className="text-sm font-medium text-amber-800">กำลังเพิ่มรายการในบิลเดิม</p><div className="flex justify-between mt-1 text-xs text-amber-700"><span>{activeOrder.orderNumber} · {activeOrder.items.reduce((sum,item)=>sum+item.qty,0)} รายการ</span><span>ยอดเดิม ฿{activeOrder.total.toFixed(2)}</span></div></div>}</>:<div className="grid grid-cols-2 gap-2 mt-3"><input value={customerName} onChange={e=>setCustomerName(e.target.value)} placeholder="ชื่อลูกค้า (ไม่บังคับ)" className="border border-gray-200 rounded-xl px-3 py-2 text-sm"/><input value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} placeholder="เบอร์โทร (ไม่บังคับ)" className="border border-gray-200 rounded-xl px-3 py-2 text-sm"/></div>}
      <div className="flex-1 overflow-y-auto mt-3 space-y-3">{cart.map(item=><div key={item.id} className="border-b border-gray-100 pb-3"><div className="flex justify-between gap-2"><div className="min-w-0"><p className="font-medium text-sm truncate">{item.name}</p><p className="text-xs text-blue-600">฿{item.price.toFixed(2)}</p></div><div className="flex items-center gap-2"><button onClick={()=>quantity(item.id,-1)} className="p-1 bg-gray-100 rounded-full"><Minus size={13}/></button><span className="text-sm">{item.qty}</span><button onClick={()=>quantity(item.id,1)} className="p-1 bg-gray-100 rounded-full"><Plus size={13}/></button><button onClick={()=>setCart(c=>c.filter(i=>i.id!==item.id))} className="text-red-400"><Trash2 size={15}/></button></div></div><input value={item.note} onChange={e=>setCart(c=>c.map(i=>i.id===item.id?{...i,note:e.target.value}:i))} placeholder="หมายเหตุ เช่น ไม่เผ็ด" className="mt-2 w-full bg-gray-50 rounded-lg px-3 py-1.5 text-xs outline-none"/></div>)}{!cart.length&&<p className="text-center text-gray-400 text-sm mt-10">เลือกเมนูเพื่อเริ่มออเดอร์</p>}</div>
      <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="หมายเหตุรวม" rows={2} className="border border-gray-100 bg-gray-50 rounded-xl px-3 py-2 text-sm outline-none"/>
      <div className="mt-3 space-y-2 text-sm">{activeOrder&&<div className="flex justify-between"><span className="text-gray-400">ยอดเดิม</span><span>฿{activeOrder.total.toFixed(2)}</span></div>}<div className="flex justify-between"><span className="text-gray-400">{activeOrder?"รายการที่เพิ่ม":"ยอดอาหาร"}</span><span>฿{subtotal.toFixed(2)}</span></div>{!activeOrder&&<div className="flex justify-between items-center"><span className="text-gray-400">ส่วนลด</span><input type="number" min="0" max={subtotal} value={discount} onChange={e=>setDiscount(e.target.value)} className="w-24 text-right border rounded-lg px-2 py-1"/></div>}<div className="flex justify-between border-t pt-2 font-semibold text-lg"><span>{activeOrder?"รวมหลังเพิ่ม":"รวม"}</span><span className="text-blue-600">฿{combinedTotal.toFixed(2)}</span></div></div>
      {message&&<p className={`text-xs mt-2 ${message.includes("แล้ว")?"text-emerald-600":"text-red-500"}`}>{message}</p>}
      <button onClick={submit} disabled={loading||!cart.length} className="mt-3 w-full py-3 rounded-xl bg-[#356DDB] text-white disabled:opacity-50">{loading?"กำลังส่ง...":orderType==="TAKEAWAY"?"สร้างคิวและส่งเข้าครัว":activeOrder?"เพิ่มรายการเข้าบิลเดิม":"ส่งออเดอร์เข้าครัว"}</button>
    </aside>
  </div>;
}
