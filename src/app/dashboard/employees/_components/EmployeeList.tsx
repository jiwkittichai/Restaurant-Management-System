/**
 * EmployeeList แสดงรายการข้อมูลในส่วนพนักงานและสิทธิ์การใช้งาน
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import { CheckCircle2, Filter, History, Pencil, Power, Search } from "lucide-react";
import Link from "next/link";
import { formatRelativeDate } from "../../formatters";
import { roleText } from "../roles";
import type { Employee, Role } from "../types";
import EmployeeCard from "./EmployeeCard";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

type EmployeeListProps = {
  employees: Employee[];
  query: string;
  roleFilter: "ALL" | Role;
  statusFilter: StatusFilter;
  onQuery: (value: string) => void;
  onRoleFilter: (value: "ALL" | Role) => void;
  onStatusFilter: (value: StatusFilter) => void;
  onToggle: (employee: Employee) => void;
};

export default function EmployeeList({
  employees,
  query,
  roleFilter,
  statusFilter,
  onQuery,
  onRoleFilter,
  onStatusFilter,
  onToggle,
}: EmployeeListProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">รายชื่อพนักงาน</h2>
          <p className="mt-1 text-sm text-gray-400">ค้นหา กรอง และแก้ไขบัญชีได้จากรายการนี้</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_170px_150px] lg:w-[680px]">
          <label className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
            <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder="ค้นหาชื่อหรือ username" className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400" />
          </label>
          <label className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <select value={roleFilter} onChange={(event) => onRoleFilter(event.target.value as "ALL" | Role)} className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-8 text-sm outline-none focus:border-blue-400">
              <option value="ALL">ทุกบทบาท</option>
              {(Object.keys(roleText) as Role[]).map((role) => <option key={role} value={role}>{roleText[role]}</option>)}
            </select>
          </label>
          <select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value as StatusFilter)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400">
            <option value="ALL">ทุกสถานะ</option>
            <option value="ACTIVE">ใช้งาน</option>
            <option value="INACTIVE">ปิดใช้งาน</option>
          </select>
        </div>
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr><th className="p-4 text-left">พนักงาน</th><th className="p-4 text-left">บทบาท</th><th className="p-4 text-left">เข้าสู่ระบบล่าสุด</th><th className="p-4 text-center">สถานะ</th><th className="p-4 text-center">จัดการ</th></tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-t border-gray-100">
                <td className="p-4"><p className="font-medium text-gray-900">{employee.displayName}</p><p className="text-xs text-gray-400">@{employee.username}</p></td>
                <td className="p-4"><div className="flex flex-wrap gap-1">{employee.roles.map((role) => <span key={role} className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600">{roleText[role]}</span>)}</div></td>
                <td className="p-4 text-gray-500">{employee.lastLoginAt ? formatRelativeDate(employee.lastLoginAt) : "ยังไม่เคยเข้าสู่ระบบ"}</td>
                <td className="p-4 text-center"><span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${employee.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}><CheckCircle2 size={13} />{employee.active ? "ใช้งาน" : "ปิดใช้งาน"}</span></td>
                <td className="p-4">
                  <div className="flex flex-wrap justify-center gap-2">
                    <Link href={`/dashboard/employees/${employee.id}/history`} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-indigo-600 hover:bg-indigo-100"><History size={15} />ประวัติ</Link>
                    <Link href={`/dashboard/employees/${employee.id}/edit`} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-blue-600 hover:bg-blue-100"><Pencil size={15} />แก้ไข</Link>
                    <button onClick={() => onToggle(employee)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 ${employee.active ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}><Power size={15} />{employee.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 sm:hidden">
        {employees.map((employee) => <EmployeeCard key={employee.id} employee={employee} onToggle={onToggle} />)}
      </div>

      {!employees.length && <p className="p-8 text-center text-sm text-gray-400">ไม่พบพนักงานตามเงื่อนไขที่เลือก</p>}
    </section>
  );
}
