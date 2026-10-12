"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  CircleCheck,
  CircleX,
  Eye,
  History,
  Search,
  ShieldAlert,
  Store,
  UserPlus,
} from "lucide-react";
import CreateRestaurantModal from "./CreateRestaurantModal";
import RestaurantActionModal from "./RestaurantActionModal";
import { platformRequest } from "../../_lib/api";
import { restaurantCode, restaurantStatus } from "../../_lib/formatters";
import type {
  PlatformRestaurant,
  RestaurantAction,
  RestaurantList as RestaurantListData,
} from "../../_lib/types";

const inputClass =
  "rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50";

export default function RestaurantList() {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<RestaurantListData | null>(null);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("oldest");
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [revision, setRevision] = useState(0);
  const [reviewAction, setReviewAction] = useState<RestaurantAction | null>(
    null,
  );

  const load = useCallback(async () => {
    const params = new URLSearchParams({
      q: search,
      status,
      sort,
      page: String(page),
    });
    setData(
      await platformRequest<RestaurantListData>(
        `/api/platform/restaurants?${params}`,
      ),
    );
  }, [search, status, sort, page, revision]);

  useEffect(() => {
    let alive = true;
    setError("");
    load().catch((caught) => {
      if (alive) setError((caught as Error).message);
    });
    return () => {
      alive = false;
    };
  }, [load]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(query.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  function selectStatus(next: string) {
    setStatus(next);
    setPage(1);
    setMessage("");
  }

  function changePage(next: number) {
    setPage(next);
    requestAnimationFrame(() =>
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      }),
    );
  }

  function openAction(
    restaurant: PlatformRestaurant,
    action: RestaurantAction["action"],
  ) {
    setReviewAction({ restaurant, action });
    setMessage("");
  }

  const filters = [
    {
      value: "",
      label: "ร้านทั้งหมด",
      count: data?.summary.restaurants ?? 0,
      icon: Building2,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      value: "pending",
      label: "รออนุมัติ",
      count: data?.summary.pending ?? 0,
      icon: History,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      value: "suspended",
      label: "ระงับ",
      count: data?.summary.suspended ?? 0,
      icon: ShieldAlert,
      tone: "bg-orange-50 text-orange-600",
    },
    {
      value: "rejected",
      label: "ไม่อนุมัติ",
      count: data?.summary.rejected ?? 0,
      icon: CircleX,
      tone: "bg-red-50 text-red-500",
    },
    {
      value: "active",
      label: "เปิดใช้งาน",
      count: data?.summary.active ?? 0,
      icon: CircleCheck,
      tone: "bg-emerald-50 text-emerald-600",
    },
  ];
  const totalPages = data
    ? Math.max(1, Math.ceil(data.total / data.pageSize))
    : 1;
  const emptyLabel = search.trim()
    ? "ไม่พบร้านที่ค้นหา"
    : "ยังไม่มีร้านในสถานะนี้";

  return (
    <section className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={() => { setCreateOpen(true); setMessage(""); }} className="inline-flex items-center gap-2 rounded-xl bg-[#356DDB] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
          <UserPlus size={18} />
          เพิ่มบัญชีร้าน
        </button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          {message}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {filters.map(({ value, label, count, icon: Icon, tone }) => (
          <button
            key={value || "all"}
            type="button"
            onClick={() => selectStatus(value)}
            className={`flex items-center gap-3 rounded-2xl border bg-white p-4 text-left transition ${status === value ? "border-blue-200 ring-4 ring-blue-50" : "border-gray-100 hover:border-blue-100"}`}
          >
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${tone}`}
            >
              <Icon size={19} />
            </span>
            <span className="min-w-0">
              <span
                className={`block truncate text-xs font-medium ${status === value ? "text-blue-600" : "text-gray-400"}`}
              >
                {label}
              </span>
              <span className="mt-1 block text-xl font-semibold text-gray-900">
                {count.toLocaleString("th-TH")}
              </span>
            </span>
          </button>
        ))}
      </div>
      <div
        className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 sm:flex-row"
      >
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">ค้นหาร้าน</span>
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            maxLength={100}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาชื่อร้านหรือรหัสร้าน"
            className={`${inputClass} w-full pl-10`}
          />
        </label>
        <button
          type="button"
          aria-label={`เรียงลำดับร้าน: ${sort === "newest" ? "ใหม่-เก่า" : "เก่า-ใหม่"}`}
          title={sort === "newest" ? "ใหม่-เก่า" : "เก่า-ใหม่"}
          onClick={() => {
            setSort(current => current === "newest" ? "oldest" : "newest");
            setPage(1);
          }}
          className={`${inputClass} grid h-[46px] w-[52px] shrink-0 cursor-pointer place-items-center self-end p-0 text-gray-700 hover:border-blue-200 hover:bg-blue-50 sm:self-auto`}
        >
          {sort === "newest" ? <ArrowDown size={17} /> : <ArrowUp size={17} />}
        </button>
      </div>
      <div
        ref={resultsRef}
        className="scroll-mt-4 overflow-x-auto rounded-2xl border border-gray-100 bg-white"
      >
        <table className="w-full min-w-[900px] table-fixed text-center text-sm">
          <thead className="bg-slate-50/80 text-gray-500">
            <tr>
              <th className="w-[29%] px-6 py-4 font-medium">ร้าน</th>
              <th className="w-[23%] px-6 py-4 font-medium">ผู้ใช้</th>
              <th className="w-[15%] px-6 py-4 font-medium">สถานะ</th>
              <th className="w-[33%] px-6 py-4 font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {data?.restaurants.map((row) => {
              const current = restaurantStatus(row);
              const StatusIcon = row.approvalStatus === "PENDING"
                ? History
                : row.approvalStatus === "REJECTED"
                  ? CircleX
                  : row.active
                    ? CircleCheck
                    : ShieldAlert;
              return (
                <tr
                  key={row.id}
                  className="transition even:bg-slate-50/40 hover:bg-blue-50/40"
                >
                  <td className="px-6 py-5">
                    <p className="truncate font-semibold">{row.name}</p>
                    <p className="mt-1 truncate text-xs text-gray-400">
                      {restaurantCode(row.id)}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="truncate font-medium text-gray-700">
                      {row.owner?.displayName || "ไม่ระบุ"}
                    </p>
                    <p className="mt-1 truncate text-xs text-gray-400">
                      {row.owner?.email || "ยังไม่มีอีเมล"}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${current.className}`}
                    >
                      <StatusIcon size={13} aria-hidden="true" />
                      {current.text}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap justify-center gap-2">
                      {row.approvalStatus === "PENDING" && (
                        <>
                          <button
                            type="button"
                            onClick={() => openAction(row, "APPROVED")}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                          >
                            <CircleCheck size={15} aria-hidden="true" />
                            อนุมัติ
                          </button>
                          <button
                            type="button"
                            onClick={() => openAction(row, "REJECTED")}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                          >
                            <CircleX size={15} aria-hidden="true" />
                            ปฏิเสธ
                          </button>
                        </>
                      )}
                      {row.approvalStatus === "REJECTED" && (
                        <button
                          type="button"
                          onClick={() => openAction(row, "APPROVED")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                        >
                          <CircleCheck size={15} aria-hidden="true" />
                          อนุมัติ
                        </button>
                      )}
                      {row.approvalStatus === "APPROVED" && (
                        <button
                          type="button"
                          onClick={() =>
                            openAction(row, row.active ? "SUSPEND" : "RESUME")
                          }
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 ${row.active ? "bg-red-50 text-red-500 hover:bg-red-100 focus-visible:ring-red-200" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 focus-visible:ring-emerald-200"}`}
                        >
                          {row.active ? <ShieldAlert size={15} aria-hidden="true" /> : <CircleCheck size={15} aria-hidden="true" />}
                          {row.active ? "ระงับ" : "เปิดใช้งาน"}
                        </button>
                      )}
                      <Link
                        href={`/platform/restaurants/${row.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-600 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                      >
                        <Eye size={15} aria-hidden="true" />
                        ดูรายละเอียด
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
            {data?.restaurants.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center">
                  <Store size={20} className="mx-auto text-slate-400" />
                  <p className="mt-3 text-sm text-gray-500">{emptyLabel}</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {!data && (
          <p className="p-8 text-center text-sm text-gray-400">
            กำลังโหลดร้าน...
          </p>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => changePage(page - 1)}
            className={`${inputClass} min-w-24 disabled:opacity-40`}
          >
            ก่อนหน้า
          </button>
          <span className="text-xs text-gray-400">
            หน้า {page.toLocaleString("th-TH")} จาก{" "}
            {totalPages.toLocaleString("th-TH")}
          </span>
          <button
            type="button"
            disabled={!data || page * data.pageSize >= data.total}
            onClick={() => changePage(page + 1)}
            className={`${inputClass} min-w-24 disabled:opacity-40`}
          >
            ถัดไป
          </button>
        </div>
      )}
      {reviewAction && (
        <RestaurantActionModal
          action={reviewAction}
          onClose={() => setReviewAction(null)}
          onCompleted={(completed) => {
            setReviewAction(null);
            setMessage(completed);
            void load();
          }}
        />
      )}
      {createOpen && (
        <CreateRestaurantModal
          onClose={() => setCreateOpen(false)}
          onCompleted={(completed) => {
            setCreateOpen(false);
            setMessage(completed);
            setQuery("");
            setSearch("");
            setStatus("active");
            setPage(1);
            setRevision(value => value + 1);
          }}
        />
      )}
    </section>
  );
}
