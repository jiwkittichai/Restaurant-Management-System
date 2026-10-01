"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Filter,
  History,
  Pencil,
  Power,
  Search,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { Audit, formatDate, roleText } from "../../audits/utils";
import type { Employee, Role } from "../types";
import RecentEmployeeActivity from "./RecentEmployeeActivity";

export default function EmployeesPageClient() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");
  const [message, setMessage] = useState("");
  const [confirmingToggle, setConfirmingToggle] = useState<Employee | null>(null);

  const load = useCallback(
    () =>
      fetch("/api/employees")
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          setEmployees(data.employees);
          setAudits(data.recentAudits);
        })
        .catch((error) => setMessage(error.message)),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesQuery =
        !normalizedQuery ||
        employee.displayName.toLowerCase().includes(normalizedQuery) ||
        employee.username.toLowerCase().includes(normalizedQuery);
      const matchesRole = roleFilter === "ALL" || employee.roles.includes(roleFilter);
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && employee.active) ||
        (statusFilter === "INACTIVE" && !employee.active);
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [employees, query, roleFilter, statusFilter]);

  const activeCount = employees.filter((employee) => employee.active).length;

  async function toggleEmployeeStatus(employee: Employee) {
    const response = await fetch("/api/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: employee.id, active: !employee.active }),
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error);
    setConfirmingToggle(null);
    setMessage(employee.active ? "ปิดใช้งานบัญชีแล้ว" : "เปิดใช้งานบัญชีแล้ว");
    load();
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
      <section className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">ภาพรวมพนักงาน</h2>
            <p className="text-sm text-gray-400 mt-1">จัดการบัญชีในระบบ</p>
          </div>
          <Link href="/dashboard/employees/create" className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-[#356DDB] px-5 py-3 text-white">
            <UserPlus size={17} />
            เพิ่มพนักงาน
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 px-4 py-3">
            <p className="text-sm text-gray-400">ทั้งหมด</p>
            <p className="mt-1 font-semibold text-gray-900">{employees.length} คน</p>
          </div>
          <div className="rounded-xl border border-gray-100 px-4 py-3">
            <p className="text-sm text-gray-400">ใช้งาน</p>
            <p className="mt-1 font-semibold text-emerald-600">{activeCount} คน</p>
          </div>
          <div className="rounded-xl border border-gray-100 px-4 py-3">
            <p className="text-sm text-gray-400">ปิดใช้งาน</p>
            <p className="mt-1 font-semibold text-gray-500">{employees.length - activeCount} คน</p>
          </div>
        </div>
      </section>

      {message && <p className={`text-sm ${message.includes("แล้ว") ? "text-emerald-600" : "text-red-500"}`}>{message}</p>}

      <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">รายชื่อพนักงาน</h2>
            <p className="text-sm text-gray-400 mt-1">ค้นหา กรอง และแก้ไขบัญชีได้จากรายการนี้</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_170px_150px] lg:w-[680px]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ค้นหาชื่อหรือ username"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400"
              />
            </label>
            <label className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as "ALL" | Role)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-8 text-sm outline-none focus:border-blue-400"
              >
                <option value="ALL">ทุกบทบาท</option>
                {(Object.keys(roleText) as Role[]).map((item) => (
                  <option key={item} value={item}>{roleText[item]}</option>
                ))}
              </select>
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="ACTIVE">ใช้งาน</option>
              <option value="INACTIVE">ปิดใช้งาน</option>
            </select>
          </div>
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-4 text-left">พนักงาน</th>
                <th className="p-4 text-left">บทบาท</th>
                <th className="p-4 text-left">เข้าสู่ระบบล่าสุด</th>
                <th className="p-4 text-center">สถานะ</th>
                <th className="p-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((item) => (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{item.displayName}</p>
                    <p className="text-xs text-gray-400">@{item.username}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {item.roles.map((role) => (
                        <span key={role} className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs">{roleText[role]}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-gray-500">{formatDate(item.lastLoginAt)}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${item.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      <CheckCircle2 size={13} />
                      {item.active ? "ใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap justify-center gap-2">
                      <Link href={`/dashboard/employees/${item.id}/history`} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-indigo-600 hover:bg-indigo-100">
                        <History size={15} />
                        ประวัติ
                      </Link>
                      <Link href={`/dashboard/employees/${item.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-blue-600 hover:bg-blue-100">
                        <Pencil size={15} />
                        แก้ไข
                      </Link>
                      <button
                        onClick={() => setConfirmingToggle(item)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 ${item.active ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                      >
                        <Power size={15} />
                        {item.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-4 sm:hidden">
          {filteredEmployees.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">{item.displayName}</p>
                  <p className="text-xs text-gray-400">@{item.username}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${item.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{item.active ? "ใช้งาน" : "ปิดใช้งาน"}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {item.roles.map((role) => (
                  <span key={role} className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs">{roleText[role]}</span>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-400">เข้าสู่ระบบล่าสุด: {formatDate(item.lastLoginAt)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/dashboard/employees/${item.id}/history`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-600">
                  <History size={15} />
                  ประวัติ
                </Link>
                <Link href={`/dashboard/employees/${item.id}/edit`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-600">
                  <Pencil size={15} />
                  แก้ไข
                </Link>
                <button onClick={() => setConfirmingToggle(item)} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm ${item.active ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
                  <Power size={15} />
                  {item.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {!filteredEmployees.length && <p className="p-8 text-center text-sm text-gray-400">ไม่พบพนักงานตามเงื่อนไขที่เลือก</p>}
      </section>

      <RecentEmployeeActivity audits={audits} />

      {confirmingToggle && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="font-semibold text-gray-900">{confirmingToggle.active ? "ปิดใช้งานบัญชีพนักงาน" : "เปิดใช้งานบัญชีพนักงาน"}</h2>
            <p className="mt-2 text-sm text-gray-500">
              {confirmingToggle.active
                ? `ต้องการปิดใช้งาน ${confirmingToggle.displayName} หรือไม่? ผู้ใช้นี้จะเข้าสู่ระบบไม่ได้ แต่ประวัติกิจกรรมเดิมยังอยู่`
                : `ต้องการเปิดใช้งาน ${confirmingToggle.displayName} อีกครั้งหรือไม่?`}
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmingToggle(null)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-600">ยกเลิก</button>
              <button
                onClick={() => toggleEmployeeStatus(confirmingToggle)}
                className={`flex-1 rounded-xl px-4 py-3 text-white ${confirmingToggle.active ? "bg-red-500" : "bg-emerald-600"}`}
              >
                {confirmingToggle.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
