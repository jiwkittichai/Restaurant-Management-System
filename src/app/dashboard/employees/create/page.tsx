"use client";

import { FormEvent, useState } from "react";
import { ArrowLeft, Save, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Role = "OWNER" | "CASHIER" | "KITCHEN" | "STOCK";
type EmployeeForm = { displayName: string; username: string; password: string; roles: Role[] };

const roleText: Record<Role, string> = {
  OWNER: "เจ้าของร้าน/ผู้จัดการ",
  CASHIER: "แคชเชียร์",
  KITCHEN: "พนักงานครัว",
  STOCK: "พนักงานสต็อก",
};

const roleDescription: Record<Role, string> = {
  OWNER: "เข้าถึงทุกเมนูและจัดการพนักงาน",
  CASHIER: "รับออเดอร์และชำระเงิน",
  KITCHEN: "ดูและอัปเดตสถานะอาหาร",
  STOCK: "จัดการวัตถุดิบและสูตรอาหาร",
};

const emptyForm: EmployeeForm = { displayName: "", username: "", password: "", roles: ["CASHIER"] };

function toggleRole(form: EmployeeForm, selectedRole: Role): EmployeeForm {
  return {
    ...form,
    roles: form.roles.includes(selectedRole)
      ? form.roles.filter((role) => role !== selectedRole)
      : [...form.roles, selectedRole],
  };
}

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

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">ชื่อพนักงาน</span>
            <input
              required
              value={form.displayName}
              onChange={(event) => setForm({ ...form, displayName: event.target.value })}
              placeholder="กรอกชื่อพนักงาน"
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">ชื่อผู้ใช้</span>
            <input
              required
              value={form.username}
              onChange={(event) => setForm({ ...form, username: event.target.value.toLowerCase() })}
              placeholder="กรอกชื่อผู้ใช้"
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">รหัสผ่านเริ่มต้น</span>
            <input
              required
              minLength={8}
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="กรอกรหัสผ่านอย่างน้อย 8 ตัว"
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400"
            />
          </label>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-700">บทบาท</span>
            <span className="text-xs text-gray-400">เลือกได้หลายบทบาท</span>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(Object.keys(roleText) as Role[]).map((item) => (
              <label
                key={item}
                className={`rounded-xl border p-4 text-sm cursor-pointer transition ${
                  form.roles.includes(item) ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <input type="checkbox" checked={form.roles.includes(item)} onChange={() => setForm(toggleRole(form, item))} />
                  {roleText[item]}
                </span>
                <span className="mt-1 block text-xs text-gray-400">{roleDescription[item]}</span>
              </label>
            ))}
          </div>
        </div>

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
