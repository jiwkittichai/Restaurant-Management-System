/**
 * TodayEmployees แสดงรายชื่อและสถานะของพนักงานที่ใช้งานวันนี้
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import { Eye } from "lucide-react";
import type { Employee } from "./types";
import { formatLogin, primaryRole } from "./utils";

type TodayEmployeesProps = {
  employees: Employee[];
  onManage: () => void;
  onHistory: (employee: Employee) => void;
};

export default function TodayEmployees({ employees, onManage, onHistory }: TodayEmployeesProps) {
  return (
    <div className="min-w-0 rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold text-gray-900">รายชื่อพนักงานวันนี้</h2>
        <button type="button" onClick={onManage} className="shrink-0 rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600 sm:px-4">
          จัดการทั้งหมด
        </button>
      </div>

      <div className="mt-4 divide-y divide-gray-100 md:hidden">
        {employees.map((employee) => (
          <div key={employee.id} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium text-gray-900">{employee.displayName}</p>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${employee.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                  {employee.active ? "ใช้งาน" : "ปิดใช้งาน"}
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-gray-400">@{employee.username}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-600">{primaryRole(employee.roles)}</span>
                <span>ล่าสุด {formatLogin(employee.lastLoginAt)}</span>
              </div>
            </div>
            <button
              type="button"
              aria-label={`ดูประวัติของ ${employee.displayName}`}
              onClick={() => onHistory(employee)}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100"
            >
              <Eye size={18} />
            </button>
          </div>
        ))}
        {!employees.length && <p className="py-8 text-center text-sm text-gray-400">ยังไม่มีข้อมูลพนักงาน</p>}
      </div>

      <div className="mt-4 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[620px] text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr><th className="p-3 text-left font-medium">พนักงาน</th><th className="p-3 text-left font-medium">บทบาท</th><th className="p-3 text-left font-medium">เข้าสู่ระบบล่าสุด</th><th className="p-3 text-center font-medium">สถานะ</th><th className="p-3 text-center font-medium">จัดการ</th></tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id} className="border-t border-gray-100">
                <td className="p-3 align-middle"><p className="font-medium text-gray-900">{employee.displayName}</p><p className="text-xs text-gray-400">@{employee.username}</p></td>
                <td className="p-3 align-middle"><span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600">{primaryRole(employee.roles)}</span></td>
                <td className="whitespace-nowrap p-3 align-middle text-gray-500">{formatLogin(employee.lastLoginAt)}</td>
                <td className="p-3 text-center align-middle"><span className={`inline-flex rounded-full px-3 py-1 text-xs ${employee.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{employee.active ? "ใช้งาน" : "ปิดใช้งาน"}</span></td>
                <td className="p-3 align-middle"><div className="flex justify-center gap-2"><button type="button" title="ดูประวัติรายบุคคล" onClick={() => onHistory(employee)} className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"><Eye size={16} /></button></div></td>
              </tr>
            ))}
            {!employees.length && <tr><td className="py-10 text-center text-gray-400" colSpan={5}>ยังไม่มีข้อมูลพนักงาน</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
