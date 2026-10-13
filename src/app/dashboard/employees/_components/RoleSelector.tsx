/**
 * RoleSelector แสดงตัวเลือกที่ใช้ในส่วนพนักงานและสิทธิ์การใช้งาน
 * ใช้รับข้อมูลที่เตรียมไว้แล้วจัดวางให้อ่านง่ายและนำกลับไปใช้ในหน้าอื่นได้
 */

import type { Role } from "../types";
import { roleDescription, roleText, toggleRole } from "../roles";

export default function RoleSelector({ roles, onChange }: { roles: Role[]; onChange: (roles: Role[]) => void }) {
  return (
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
              roles.includes(role)
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            <span className="flex items-center gap-2 font-medium">
              <input type="checkbox" checked={roles.includes(role)} onChange={() => onChange(toggleRole(roles, role))} />
              {roleText[role]}
            </span>
            <span className="mt-1 block text-xs text-gray-400">{roleDescription[role]}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
