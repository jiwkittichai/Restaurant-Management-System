import { UserPlus } from "lucide-react";
import Link from "next/link";

export default function EmployeesHeader({ totalCount, activeCount }: { totalCount: number; activeCount: number }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">ภาพรวมพนักงาน</h2>
          <p className="mt-1 text-sm text-gray-400">จัดการบัญชีในระบบ</p>
        </div>
        <Link href="/dashboard/employees/create" className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-[#356DDB] px-5 py-3 text-white">
          <UserPlus size={17} /> เพิ่มพนักงาน
        </Link>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-100 px-4 py-3"><p className="text-sm text-gray-400">ทั้งหมด</p><p className="mt-1 font-semibold text-gray-900">{totalCount} คน</p></div>
        <div className="rounded-xl border border-gray-100 px-4 py-3"><p className="text-sm text-gray-400">ใช้งาน</p><p className="mt-1 font-semibold text-emerald-600">{activeCount} คน</p></div>
        <div className="rounded-xl border border-gray-100 px-4 py-3"><p className="text-sm text-gray-400">ปิดใช้งาน</p><p className="mt-1 font-semibold text-gray-500">{totalCount - activeCount} คน</p></div>
      </div>
    </section>
  );
}
