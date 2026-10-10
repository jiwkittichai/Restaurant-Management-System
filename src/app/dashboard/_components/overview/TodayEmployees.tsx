import { Eye } from "lucide-react";
import type { Employee } from "../../types";
import { formatLogin, primaryRole } from "../../utils";

type TodayEmployeesProps = {
  employees: Employee[];
  onManage: () => void;
  onHistory: (employee: Employee) => void;
};

export default function TodayEmployees({ employees, onManage, onHistory }: TodayEmployeesProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="font-semibold text-gray-900">รายชื่อพนักงานวันนี้</h2>
        <button type="button" onClick={onManage} className="w-fit rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600">
          จัดการทั้งหมด
        </button>
      </div>
      <div className="mt-4 overflow-x-auto">
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
