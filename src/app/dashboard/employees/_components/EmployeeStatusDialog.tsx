import type { Employee } from "../types";

export default function EmployeeStatusDialog({ employee, onClose, onConfirm }: { employee: Employee; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <h2 className="font-semibold text-gray-900">{employee.active ? "ปิดใช้งานบัญชีพนักงาน" : "เปิดใช้งานบัญชีพนักงาน"}</h2>
        <p className="mt-2 text-sm text-gray-500">
          {employee.active
            ? `ต้องการปิดใช้งาน ${employee.displayName} หรือไม่? ผู้ใช้นี้จะเข้าสู่ระบบไม่ได้ แต่ประวัติกิจกรรมเดิมยังอยู่`
            : `ต้องการเปิดใช้งาน ${employee.displayName} อีกครั้งหรือไม่?`}
        </p>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-600">ยกเลิก</button>
          <button onClick={onConfirm} className={`flex-1 rounded-xl px-4 py-3 text-white ${employee.active ? "bg-red-500" : "bg-emerald-600"}`}>
            {employee.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
          </button>
        </div>
      </div>
    </div>
  );
}
