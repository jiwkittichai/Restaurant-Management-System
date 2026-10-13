/**
 * หน้าเพิ่มพนักงานใหม่
 * ใช้รวมส่วนประกอบที่จำเป็นและเป็นจุดเริ่มต้นของการทำงานบนหน้าจอ
 */

"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EmployeeFormFields from "../_components/EmployeeFormFields";
import RoleSelector from "../_components/RoleSelector";
import type { EmployeeForm } from "../types";

const emptyForm: EmployeeForm = { displayName: "", username: "", password: "", roles: ["CASHIER"] };

export default function CreateEmployeePage() {
  const router = useRouter();
  const [form, setForm] = useState<EmployeeForm>(emptyForm);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(data.error);
    router.push("/dashboard/employees");
  }

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link href="/dashboard/employees" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600">
          <ArrowLeft size={17} />
          กลับ
        </Link>
      </div>

      <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
        <div className="flex items-start gap-3 border-b border-gray-100 pb-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <UserPlus size={22} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">เพิ่มบัญชีพนักงาน</h2>
            <p className="mt-1 text-sm text-gray-400">สร้างบัญชีใหม่พร้อมกำหนดบทบาท</p>
          </div>
        </div>

        <EmployeeFormFields
          displayName={form.displayName}
          username={form.username}
          onDisplayName={(displayName) => setForm({ ...form, displayName })}
          onUsername={(username) => setForm({ ...form, username })}
        />

        <label className="mt-5 block">
          <span className="text-sm font-medium text-gray-700">รหัสผ่านเริ่มต้น</span>
          <input required minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="กรอกรหัสผ่านอย่างน้อย 8 ตัว" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400" />
        </label>

        <RoleSelector roles={form.roles} onChange={(roles) => setForm({ ...form, roles })} />

        {message && <p className="mt-4 text-sm text-red-500">{message}</p>}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => router.back()} className="rounded-xl border border-gray-200 px-5 py-3 text-gray-600">ยกเลิก</button>
          <button disabled={saving || !form.roles.length} className="rounded-xl bg-[#356DDB] px-5 py-3 text-white disabled:opacity-50">
            <span className="inline-flex items-center justify-center gap-2">
              <Save size={17} />
              {saving ? "กำลังบันทึก..." : "บันทึกพนักงาน"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
