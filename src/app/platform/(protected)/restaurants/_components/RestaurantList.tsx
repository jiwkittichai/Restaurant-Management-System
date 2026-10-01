"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Building2, CircleCheck, CircleX, History, ShieldAlert, Store } from "lucide-react";
import RestaurantActionModal from "../../_components/RestaurantActionModal";
import { platformRequest } from "../../_lib/api";
import { restaurantStatus } from "../../_lib/formatters";
import type { PlatformRestaurant, RestaurantAction, RestaurantList as RestaurantListData } from "../../_lib/types";

const inputClass = "rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50";

export default function RestaurantList() {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<RestaurantListData | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("pending");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [reviewAction, setReviewAction] = useState<RestaurantAction | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams({ q: search, status, sort, page: String(page) });
    setData(await platformRequest<RestaurantListData>(`/api/platform/restaurants?${params}`));
  }, [search, status, sort, page]);

  useEffect(() => {
    let alive = true;
    setError("");
    load().catch(caught => { if (alive) setError((caught as Error).message); });
    return () => { alive = false; };
  }, [load]);

  function selectStatus(next: string) {
    setStatus(next);
    setPage(1);
    setMessage("");
  }

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(query);
  }

  function changePage(next: number) {
    setPage(next);
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function openAction(restaurant: PlatformRestaurant, action: RestaurantAction["action"]) {
    setReviewAction({ restaurant, action });
    setMessage("");
  }

  const filters = [
    { value: "pending", label: "รออนุมัติ", count: data?.summary.pending ?? 0, icon: History, tone: "bg-amber-50 text-amber-600" },
    { value: "active", label: "เปิดใช้งาน", count: data?.summary.active ?? 0, icon: CircleCheck, tone: "bg-emerald-50 text-emerald-600" },
    { value: "suspended", label: "ระงับ", count: data?.summary.suspended ?? 0, icon: ShieldAlert, tone: "bg-orange-50 text-orange-600" },
    { value: "rejected", label: "ไม่อนุมัติ", count: data?.summary.rejected ?? 0, icon: CircleX, tone: "bg-red-50 text-red-500" },
    { value: "", label: "ร้านทั้งหมด", count: data?.summary.restaurants ?? 0, icon: Building2, tone: "bg-blue-50 text-blue-600" },
  ];
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const emptyLabel = search.trim() ? "ไม่พบร้านที่ค้นหา" : "ยังไม่มีร้านในสถานะนี้";

  return <section className="space-y-4">{error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}{message && <p role="status" className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{message}</p>}<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{filters.map(({ value, label, count, icon: Icon, tone }) => <button key={value || "all"} type="button" onClick={() => selectStatus(value)} className={`flex items-center gap-3 rounded-2xl border bg-white p-4 text-left transition ${status === value ? "border-blue-200 ring-4 ring-blue-50" : "border-gray-100 hover:border-blue-100"}`}><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={19} /></span><span className="min-w-0"><span className={`block truncate text-xs font-medium ${status === value ? "text-blue-600" : "text-gray-400"}`}>{label}</span><span className="mt-1 block text-xl font-semibold text-gray-900">{count.toLocaleString("th-TH")}</span></span></button>)}</div><form className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row" onSubmit={submitSearch}><input aria-label="ค้นหาร้าน" value={query} maxLength={100} onChange={event => setQuery(event.target.value)} placeholder="ค้นหาจากชื่อร้านหรือรหัสร้าน" className={`${inputClass} min-w-0 flex-1`} /><select aria-label="เรียงลำดับร้าน" value={sort} onChange={event => { setSort(event.target.value as "newest" | "oldest"); setPage(1); }} className={`${inputClass} min-w-40 cursor-pointer`}><option value="newest">ใหม่–เก่า</option><option value="oldest">เก่า–ใหม่</option></select><button className="rounded-xl bg-[#356DDB] px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">ค้นหา</button></form><div ref={resultsRef} className="scroll-mt-4 overflow-x-auto rounded-2xl border border-gray-100 bg-white"><table className="w-full min-w-[900px] table-fixed text-center text-sm"><thead className="bg-slate-50/80 text-gray-500"><tr><th className="w-[29%] px-6 py-4 font-medium">ร้าน</th><th className="w-[23%] px-6 py-4 font-medium">ผู้ใช้</th><th className="w-[15%] px-6 py-4 font-medium">สถานะ</th><th className="w-[33%] px-6 py-4 font-medium">จัดการ</th></tr></thead><tbody>{data?.restaurants.map(row => { const current = restaurantStatus(row); return <tr key={row.id} className="transition even:bg-slate-50/40 hover:bg-blue-50/40"><td className="px-6 py-5"><p className="truncate font-semibold">{row.name}</p><p className="mt-1 truncate text-xs text-gray-400">#{row.id} · {row.slug}</p></td><td className="px-6 py-5"><p className="truncate font-medium text-gray-700">{row.owner?.displayName || "ไม่ระบุ"}</p><p className="mt-1 truncate text-xs text-gray-400">{row.owner?.email || "ยังไม่มีอีเมล"}</p></td><td className="px-6 py-5"><span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${current.className}`}>{current.text}</span></td><td className="px-6 py-5"><div className="flex flex-wrap justify-center gap-2">{row.approvalStatus === "PENDING" && <><button type="button" onClick={() => openAction(row, "APPROVED")} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">อนุมัติ</button><button type="button" onClick={() => openAction(row, "REJECTED")} className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">ปฏิเสธ</button></>}{row.approvalStatus === "REJECTED" && <button type="button" onClick={() => openAction(row, "APPROVED")} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">อนุมัติ</button>}{row.approvalStatus === "APPROVED" && <button type="button" onClick={() => openAction(row, row.active ? "SUSPEND" : "RESUME")} className={`rounded-lg px-3 py-2 text-xs font-semibold ${row.active ? "bg-orange-50 text-orange-700" : "bg-emerald-50 text-emerald-700"}`}>{row.active ? "ระงับ" : "เปิดใช้งาน"}</button>}<Link href={`/platform/restaurants/${row.id}`} className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600">ดูรายละเอียด</Link></div></td></tr>; })}{data?.restaurants.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center"><Store size={20} className="mx-auto text-slate-400" /><p className="mt-3 text-sm text-gray-500">{emptyLabel}</p></td></tr>}</tbody></table>{!data && <p className="p-8 text-center text-sm text-gray-400">กำลังโหลดร้าน...</p>}</div>{totalPages > 1 && <div className="flex items-center justify-between gap-3 text-sm"><button type="button" disabled={page <= 1} onClick={() => changePage(page - 1)} className={`${inputClass} min-w-24 disabled:opacity-40`}>ก่อนหน้า</button><span className="text-xs text-gray-400">หน้า {page.toLocaleString("th-TH")} จาก {totalPages.toLocaleString("th-TH")}</span><button type="button" disabled={!data || page * data.pageSize >= data.total} onClick={() => changePage(page + 1)} className={`${inputClass} min-w-24 disabled:opacity-40`}>ถัดไป</button></div>}{reviewAction && <RestaurantActionModal action={reviewAction} onClose={() => setReviewAction(null)} onCompleted={completed => { setReviewAction(null); setMessage(completed); void load(); }} />}</section>;
}
