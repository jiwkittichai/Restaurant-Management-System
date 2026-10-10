import { History, Pencil, Power } from "lucide-react";
import Link from "next/link";
import { formatDate } from "../../audits/formatters";
import { roleText } from "../roles";
import type { Employee } from "../types";

export default function EmployeeCard({ employee, onToggle }: { employee: Employee; onToggle: (employee: Employee) => void }) {
  return (
    <div className="rounded-xl border border-gray-100 p-4">
      <div className="flex items-start justify-between gap-3">
        <div><p className="font-medium text-gray-900">{employee.displayName}</p><p className="text-xs text-gray-400">@{employee.username}</p></div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${employee.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{employee.active ? "ใช้งาน" : "ปิดใช้งาน"}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {employee.roles.map((role) => <span key={role} className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-600">{roleText[role]}</span>)}
      </div>
      <p className="mt-3 text-xs text-gray-400">เข้าสู่ระบบล่าสุด: {formatDate(employee.lastLoginAt)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={`/dashboard/employees/${employee.id}/history`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-600"><History size={15} />ประวัติ</Link>
        <Link href={`/dashboard/employees/${employee.id}/edit`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-600"><Pencil size={15} />แก้ไข</Link>
        <button onClick={() => onToggle(employee)} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm ${employee.active ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}><Power size={15} />{employee.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}</button>
      </div>
    </div>
  );
}
