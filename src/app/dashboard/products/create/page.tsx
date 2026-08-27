"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: number; name: string };
type OptionDraft = { name: string; price: string };
type GroupDraft = { name: string; required: boolean; minSelect: string; maxSelect: string; options: OptionDraft[] };

export default function CreateMenuPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", sku: `MENU-${Date.now().toString().slice(-6)}`, description: "", price: "", saleUnit: "จาน", categoryId: "" });
  const [modifierGroups, setModifierGroups] = useState<GroupDraft[]>([]);
  useEffect(() => { fetch("/api/categories").then((r) => r.json()).then(setCategories); }, []);

  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      let image = "";
      if (file) {
        const body = new FormData(); body.append("file", file);
        const upload = await fetch("/api/upload", { method: "POST", body });
        if (!upload.ok) throw new Error("อัปโหลดรูปไม่สำเร็จ");
        image = (await upload.json()).url;
      }
      const res = await fetch("/api/menu", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, image, modifierGroups }) });
      const data = await res.json(); if (!res.ok) throw new Error(data.error);
      router.push("/dashboard/products");
    } catch (e) { setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด"); } finally { setLoading(false); }
  }

  return <div className="p-6 max-w-3xl mx-auto"><form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
    <div><label className="text-sm text-gray-600">รูปเมนู</label><p className="text-xs text-gray-400 mt-1">แนะนำภาพแนวนอนอัตราส่วน 4:3 เช่น 1200 × 900 พิกเซล</p><div className="mt-3 flex items-center gap-4"><label className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl cursor-pointer">เลือกรูป<input type="file" accept="image/*" className="hidden" onChange={(e) => { const f=e.target.files?.[0]; if(f){setFile(f);setPreview(URL.createObjectURL(f));} }} /></label>{preview && <div className="w-40 aspect-[4/3] rounded-xl overflow-hidden bg-gray-100"><img src={preview} alt="preview" className="w-full h-full object-cover object-center" /></div>}</div></div>
    <div className="grid sm:grid-cols-2 gap-4"><Field label="ชื่อเมนู" value={form.name} onChange={(v) => setForm({...form,name:v})} required /><Field label="รหัสเมนู" value={form.sku} onChange={(v) => setForm({...form,sku:v})} required /></div>
    <div><label className="text-sm text-gray-600">รายละเอียด</label><textarea value={form.description} onChange={(e) => setForm({...form,description:e.target.value})} className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none" rows={3} /></div>
    <div className="grid sm:grid-cols-3 gap-4"><Field label="ราคา" type="number" value={form.price} onChange={(v) => setForm({...form,price:v})} required /><SaleUnitField value={form.saleUnit} onChange={(v) => setForm({...form,saleUnit:v})} /><div><label className="text-sm text-gray-600">หมวดหมู่</label><select required value={form.categoryId} onChange={(e) => setForm({...form,categoryId:e.target.value})} className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 bg-white"><option value="">เลือกหมวดหมู่</option>{categories.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div></div>
    <ModifierGroupsEditor groups={modifierGroups} onChange={setModifierGroups} />
    {!categories.length && <p className="text-amber-600 text-sm">กรุณาสร้างหมวดหมู่ก่อนเพิ่มเมนู</p>}{error && <p className="text-red-500 text-sm">{error}</p>}
    <div className="flex gap-3"><button disabled={loading || !categories.length} className="bg-[#356DDB] text-white px-6 py-3 rounded-xl disabled:opacity-50">{loading ? "กำลังบันทึก..." : "บันทึกเมนู"}</button><button type="button" onClick={() => router.back()} className="bg-gray-100 px-6 py-3 rounded-xl">ยกเลิก</button></div>
  </form></div>;
}

function ModifierGroupsEditor({ groups, onChange }: { groups:GroupDraft[]; onChange:(groups:GroupDraft[])=>void }) {
  function updateGroup(index:number, patch:Partial<GroupDraft>) { onChange(groups.map((group,i)=>i===index?{...group,...patch}:group)); }
  function updateOption(groupIndex:number, optionIndex:number, patch:Partial<OptionDraft>) { onChange(groups.map((group,i)=>i!==groupIndex?group:{...group,options:group.options.map((option,j)=>j===optionIndex?{...option,...patch}:option)})); }
  return <section className="rounded-2xl border border-gray-100 p-4">
    <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-gray-900">กลุ่มตัวเลือก</h2><p className="text-xs text-gray-400">ตั้งค่าตัวเลือกเสริม</p></div><button type="button" onClick={()=>onChange([...groups,{name:"",required:false,minSelect:"0",maxSelect:"1",options:[{name:"",price:"0"}]}])} className="rounded-xl bg-blue-50 px-3 py-2 text-sm text-blue-600">เพิ่มกลุ่ม</button></div>
    <div className="mt-4 space-y-4">{groups.map((group,index)=><div key={index} className="rounded-xl border border-gray-100 p-3"><div className="grid gap-3 sm:grid-cols-[1fr_110px_110px]"><Field label="ชื่อกลุ่ม" value={group.name} onChange={value=>updateGroup(index,{name:value})}/><Field label="เลือกต่ำสุด" type="number" value={group.minSelect} onChange={value=>updateGroup(index,{minSelect:value})}/><Field label="เลือกสูงสุด" type="number" value={group.maxSelect} onChange={value=>updateGroup(index,{maxSelect:value})}/></div><label className="mt-3 flex items-center gap-2 text-sm text-gray-600"><input type="checkbox" checked={group.required} onChange={event=>updateGroup(index,{required:event.target.checked,minSelect:event.target.checked&&group.minSelect==="0"?"1":group.minSelect})} className="h-4 w-4 accent-blue-600"/>บังคับเลือก</label><div className="mt-3 space-y-2">{group.options.map((option,optionIndex)=><div key={optionIndex} className="grid gap-2 sm:grid-cols-[1fr_120px_40px]"><input value={option.name} onChange={event=>updateOption(index,optionIndex,{name:event.target.value})} placeholder="ชื่อตัวเลือก" className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"/><input type="number" min="0" step="0.01" value={option.price} onChange={event=>updateOption(index,optionIndex,{price:event.target.value})} placeholder="ราคาเพิ่ม" className="rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none"/><button type="button" onClick={()=>updateGroup(index,{options:group.options.filter((_,i)=>i!==optionIndex)})} className="rounded-xl bg-red-50 text-red-500">ลบ</button></div>)}</div><div className="mt-3 flex gap-2"><button type="button" onClick={()=>updateGroup(index,{options:[...group.options,{name:"",price:"0"}]})} className="rounded-xl bg-gray-100 px-3 py-2 text-sm text-gray-600">เพิ่มตัวเลือก</button><button type="button" onClick={()=>onChange(groups.filter((_,i)=>i!==index))} className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-500">ลบกลุ่ม</button></div></div>)}</div>
    {!groups.length&&<p className="mt-4 text-sm text-gray-400">เมนูนี้ยังไม่มีตัวเลือกเพิ่มเติม</p>}
  </section>;
}

function Field({ label, value, onChange, type="text", required=false }: { label:string; value:string; onChange:(v:string)=>void; type?:string; required?:boolean }) {
  return <div><label className="text-sm text-gray-600">{label}</label><input type={type} min={type === "number" ? 0 : undefined} step={type === "number" ? "0.01" : undefined} required={required} value={value} onChange={(e)=>onChange(e.target.value)} className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-400" /></div>;
}

function SaleUnitField({ value, onChange }: { value:string; onChange:(value:string)=>void }) {
  return <div><label className="text-sm text-gray-600">หน่วยขาย</label><input required list="sale-unit-options" value={value} onChange={(e)=>onChange(e.target.value)} placeholder="เช่น จาน" className="mt-1 w-full border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-blue-400"/><datalist id="sale-unit-options">{["จาน","ชาม","ถ้วย","แก้ว","ขวด","ชิ้น"].map(unit=><option key={unit} value={unit}/>)}</datalist></div>;
}
