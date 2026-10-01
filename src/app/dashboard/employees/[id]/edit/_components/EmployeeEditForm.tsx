"use client";


import { FormEvent, useState } from "react";
import { ArrowLeft, RotateCcw, Save, UserCog } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Role = "OWNER" | "CASHIER" | "KITCHEN" | "STOCK";
type Employee = {
  id: number;
  username: string;
  displayName: string;
  active: boolean;
  roles: Role[];
};

type EditForm = {
  displayName: string;
  password: string;
  active: boolean;
  roles: Role[];
};

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

function toggleRole(form: EditForm, selectedRole: Role): EditForm {
  return {
    ...form,
    roles: form.roles.includes(selectedRole)
      ? form.roles.filter((role) => role !== selectedRole)
      : [...form.roles, selectedRole],
  };
}

export default function EmployeeEditForm({ employee }: { employee: Employee }) {
  const router = useRouter();
  const [form, setForm] = useState<EditForm>({
    displayName: employee.displayName,
    password: "",
    active: employee.active,
    roles: employee.roles,
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: employee.id, ...form }),
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error || "อัปเดตบัญชีพนักงานไม่สำเร็จ");
      return;
    }

    router.push("/dashboard/employees");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-4">
        <Link
          href="/dashboard/employees"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
        >
          <ArrowLeft size={17} />
          กลับหน้าจัดการพนักงาน
        </Link>
      </div>

      <form onSubmit={submit} className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3 border-b border-gray-100 pb-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <UserCog size={22} />
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-gray-900">แก้ไขพนักงาน</h2>
            <p className="mt-1 truncate text-sm text-gray-400">@{employee.username}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">ชื่อพนักงาน</span>
            <input
              required
              maxLength={100}
              value={form.displayName}
              onChange={(event) => setForm({ ...form, displayName: event.target.value })}
              className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">ชื่อผู้ใช้</span>
            <input
              disabled
              value={employee.username}
              className="mt-2 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-400"
            />
            <span className="mt-1 block text-xs text-gray-400">ชื่อผู้ใช้ไม่สามารถแก้ไขได้</span>
          </label>
        </div>

        <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-gray-200 p-4">
          <span>
            <span className="block text-sm font-medium text-gray-700">สถานะบัญชี</span>
            <span className="mt-1 block text-xs text-gray-400">พนักงานเข้าสู่ระบบได้เมื่อเปิดใช้งาน</span>
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(event) => setForm({ ...form, active: event.target.checked })}
              className="h-4 w-4 accent-blue-600"
            />
            {form.active ? "ใช้งาน" : "ปิดใช้งาน"}
          </span>
        </label>

        <div className="mt-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-gray-700">บทบาท</span>
            <span className="text-xs text-gray-400">เลือกได้หลายบทบาท</span>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {(Object.keys(roleText) as Role[]).map((role) => (
              <label
                key={role}
                className={`cursor-pointer rounded-xl border p-4 text-sm transition ${
                  form.roles.includes(role)
                    ? "border-blue-300 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <input
                    type="checkbox"
                    checked={form.roles.includes(role)}
                    onChange={() => setForm(toggleRole(form, role))}
                  />
                  {roleText[role]}
                </span>
                <span className="mt-1 block text-xs text-gray-400">{roleDescription[role]}</span>
              </label>
            ))}
          </div>
        </div>

        <label className="mt-5 block">
          <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
            <RotateCcw size={16} />
            ตั้งรหัสผ่านใหม่
          </span>
          <input
            type="password"
            minLength={8}
            maxLength={128}
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน"
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400"
          />
          <span className="mt-1 block text-xs text-gray-400">หากเปลี่ยนรหัสผ่าน บัญชีนี้จะถูกออกจากระบบในอุปกรณ์เดิม</span>
        </label>

        {message && <p className="mt-4 text-sm text-red-500">{message}</p>}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Link href="/dashboard/employees" className="rounded-xl border border-gray-200 px-5 py-3 text-center text-gray-600">
            ยกเลิก
          </Link>
          <button
            disabled={saving || !form.roles.length || !form.displayName.trim()}
            className="rounded-xl bg-[#356DDB] px-5 py-3 text-white disabled:opacity-50"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Save size={17} />
              {saving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
