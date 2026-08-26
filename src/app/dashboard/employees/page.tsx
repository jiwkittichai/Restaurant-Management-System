"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Filter,
  History,
  Pencil,
  Power,
  RotateCcw,
  Save,
  Search,
  UserCog,
  UserPlus,
  X,
} from "lucide-react";
import Link from "next/link";
import { Audit, auditChangeRows, auditDetailRows, auditSummary, formatDate, roleText } from "../audit-utils";

type Role = "OWNER" | "CASHIER" | "KITCHEN" | "STOCK";
type Employee = { id: number; username: string; displayName: string; active: boolean; lastLoginAt?: string; createdAt: string; roles: Role[] };
type EditForm = { displayName: string; password: string; active: boolean; roles: Role[] };

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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ACTIVE");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmingToggle, setConfirmingToggle] = useState<Employee | null>(null);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);
  const [historyEmployee, setHistoryEmployee] = useState<Employee | null>(null);
  const [employeeHistory, setEmployeeHistory] = useState<Audit[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(
    () =>
      fetch("/api/employees")
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          setEmployees(data.employees);
          setAudits(data.recentAudits);
        })
        .catch((error) => setMessage(error.message)),
    [],
  );

  useEffect(() => {
    load();
  }, [load]);

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesQuery =
        !normalizedQuery ||
        employee.displayName.toLowerCase().includes(normalizedQuery) ||
        employee.username.toLowerCase().includes(normalizedQuery);
      const matchesRole = roleFilter === "ALL" || employee.roles.includes(roleFilter);
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && employee.active) ||
        (statusFilter === "INACTIVE" && !employee.active);
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [employees, query, roleFilter, statusFilter]);

  const activeCount = employees.filter((employee) => employee.active).length;

  function openEdit(employee: Employee) {
    setEditingEmployee(employee);
    setEditForm({ displayName: employee.displayName, password: "", active: employee.active, roles: employee.roles });
    setMessage("");
  }

  function closeEdit() {
    setEditingEmployee(null);
    setEditForm(null);
  }

  async function updateEmployee(event: FormEvent) {
    event.preventDefault();
    if (!editingEmployee || !editForm) return;
    setSaving(true);
    setMessage("");
    const response = await fetch("/api/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingEmployee.id, ...editForm }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(data.error);
    setMessage("แก้ไขบัญชีพนักงานแล้ว");
    closeEdit();
    load();
  }

  async function toggleEmployeeStatus(employee: Employee) {
    const response = await fetch("/api/employees", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: employee.id, active: !employee.active }),
    });
    const data = await response.json();
    if (!response.ok) return setMessage(data.error);
    setConfirmingToggle(null);
    setMessage(employee.active ? "ปิดใช้งานบัญชีแล้ว" : "เปิดใช้งานบัญชีแล้ว");
    load();
  }

  async function openEmployeeHistory(employee: Employee) {
    setHistoryEmployee(employee);
    setEmployeeHistory([]);
    setHistoryLoading(true);
    setMessage("");
    const response = await fetch(`/api/audits?employeeId=${employee.id}&take=100`);
    const data = await response.json();
    setHistoryLoading(false);
    if (!response.ok) return setMessage(data.error || "โหลดประวัติพนักงานไม่สำเร็จ");
    setEmployeeHistory(data.audits || []);
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-y-auto">
      <section className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">ภาพรวมพนักงาน</h2>
            <p className="text-sm text-gray-400 mt-1">จัดการบัญชีในระบบ</p>
          </div>
          <Link href="/dashboard/employees/create" className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-[#356DDB] px-5 py-3 text-white">
            <UserPlus size={17} />
            เพิ่มพนักงาน
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 px-4 py-3">
            <p className="text-sm text-gray-400">ทั้งหมด</p>
            <p className="mt-1 font-semibold text-gray-900">{employees.length} คน</p>
          </div>
          <div className="rounded-xl border border-gray-100 px-4 py-3">
            <p className="text-sm text-gray-400">ใช้งาน</p>
            <p className="mt-1 font-semibold text-emerald-600">{activeCount} คน</p>
          </div>
          <div className="rounded-xl border border-gray-100 px-4 py-3">
            <p className="text-sm text-gray-400">ปิดใช้งาน</p>
            <p className="mt-1 font-semibold text-gray-500">{employees.length - activeCount} คน</p>
          </div>
        </div>
      </section>

      {message && <p className={`text-sm ${message.includes("แล้ว") ? "text-emerald-600" : "text-red-500"}`}>{message}</p>}

      <section className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">รายชื่อพนักงาน</h2>
            <p className="text-sm text-gray-400 mt-1">ค้นหา กรอง และแก้ไขบัญชีได้จากรายการนี้</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_170px_150px] lg:w-[680px]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ค้นหาชื่อหรือ username"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400"
              />
            </label>
            <label className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value as "ALL" | Role)}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-8 text-sm outline-none focus:border-blue-400"
              >
                <option value="ALL">ทุกบทบาท</option>
                {(Object.keys(roleText) as Role[]).map((item) => (
                  <option key={item} value={item}>{roleText[item]}</option>
                ))}
              </select>
            </label>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-400"
            >
              <option value="ALL">ทุกสถานะ</option>
              <option value="ACTIVE">ใช้งาน</option>
              <option value="INACTIVE">ปิดใช้งาน</option>
            </select>
          </div>
        </div>

        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="p-4 text-left">พนักงาน</th>
                <th className="p-4 text-left">บทบาท</th>
                <th className="p-4 text-left">เข้าสู่ระบบล่าสุด</th>
                <th className="p-4 text-center">สถานะ</th>
                <th className="p-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((item) => (
                <tr key={item.id} className="border-t border-gray-100">
                  <td className="p-4">
                    <p className="font-medium text-gray-900">{item.displayName}</p>
                    <p className="text-xs text-gray-400">@{item.username}</p>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {item.roles.map((role) => (
                        <span key={role} className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs">{roleText[role]}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-gray-500">{formatDate(item.lastLoginAt)}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs ${item.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      <CheckCircle2 size={13} />
                      {item.active ? "ใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap justify-center gap-2">
                      <button onClick={() => openEmployeeHistory(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-indigo-600 hover:bg-indigo-100">
                        <History size={15} />
                        ประวัติ
                      </button>
                      <button onClick={() => openEdit(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-blue-600 hover:bg-blue-100">
                        <Pencil size={15} />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => setConfirmingToggle(item)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 ${item.active ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}
                      >
                        <Power size={15} />
                        {item.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-3 p-4 sm:hidden">
          {filteredEmployees.map((item) => (
            <div key={item.id} className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900">{item.displayName}</p>
                  <p className="text-xs text-gray-400">@{item.username}</p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${item.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>{item.active ? "ใช้งาน" : "ปิดใช้งาน"}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {item.roles.map((role) => (
                  <span key={role} className="px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs">{roleText[role]}</span>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-400">เข้าสู่ระบบล่าสุด: {formatDate(item.lastLoginAt)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => openEmployeeHistory(item)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-600">
                  <History size={15} />
                  ประวัติ
                </button>
                <button onClick={() => openEdit(item)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-600">
                  <Pencil size={15} />
                  แก้ไข
                </button>
                <button onClick={() => setConfirmingToggle(item)} className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm ${item.active ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
                  <Power size={15} />
                  {item.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {!filteredEmployees.length && <p className="p-8 text-center text-sm text-gray-400">ไม่พบพนักงานตามเงื่อนไขที่เลือก</p>}
      </section>

      {historyEmployee && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
          <button type="button" aria-label="ปิดประวัติพนักงาน" className="hidden flex-1 cursor-default sm:block" onClick={() => setHistoryEmployee(null)} />
          <div className="h-full w-full overflow-y-auto bg-white p-5 shadow-2xl sm:max-w-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="font-semibold text-gray-900">ประวัติบัญชีรายบุคคล</h2>
                <p className="mt-1 text-sm text-gray-400">{historyEmployee.displayName} @{historyEmployee.username}</p>
              </div>
              <button type="button" onClick={() => setHistoryEmployee(null)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="min-w-0 rounded-xl border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-400">พนักงาน</p>
                <p className="mt-1 break-words font-semibold leading-snug text-gray-900">{historyEmployee.displayName}</p>
                <p className="break-words text-xs text-gray-400">@{historyEmployee.username}</p>
              </div>
              <div className="min-w-0 rounded-xl border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-400">สถานะ</p>
                <p className={`mt-1 font-semibold ${historyEmployee.active ? "text-emerald-600" : "text-gray-500"}`}>
                  {historyEmployee.active ? "ใช้งาน" : "ปิดใช้งาน"}
                </p>
              </div>
              <div className="min-w-0 rounded-xl border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-400">บทบาท</p>
                <p className="mt-1 break-words font-semibold leading-snug text-gray-900">{historyEmployee.roles.map((role) => roleText[role]).join(", ")}</p>
              </div>
              <div className="min-w-0 rounded-xl border border-gray-100 px-4 py-3">
                <p className="text-xs text-gray-400">เข้าสู่ระบบล่าสุด</p>
                <p className="mt-1 font-semibold text-gray-900">{formatDate(historyEmployee.lastLoginAt)}</p>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium text-gray-900">ประวัติกิจกรรมที่เกี่ยวข้อง</h3>
                <span className="text-sm text-gray-400">{historyLoading ? "กำลังโหลด..." : `${employeeHistory.length} รายการ`}</span>
              </div>
              <div className="mt-3 divide-y divide-gray-100 rounded-2xl border border-gray-100">
                {employeeHistory.map((audit) => {
                  const changes = auditChangeRows(audit);
                  return (
                    <button
                      key={audit.id}
                      type="button"
                      onClick={() => setSelectedAudit(audit)}
                      className="block w-full px-4 py-3 text-left text-sm hover:bg-gray-50"
                    >
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{auditSummary(audit)}</p>
                          <p className="mt-1 text-xs text-gray-400">{audit.employee?.displayName || "บัญชีที่ถูกลบ"}</p>
                        </div>
                        <span className="whitespace-nowrap text-gray-400">{formatDate(audit.createdAt)}</span>
                      </div>
                      {changes.length > 0 && (
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {changes.slice(0, 2).map((row) => (
                            <div key={`${audit.id}-${row.label}`} className="rounded-lg bg-gray-50 px-3 py-2 text-xs">
                              <p className="font-medium text-gray-600">{row.label}</p>
                              <p className="mt-1 text-gray-400">{row.before ? `${row.before} -> ${row.after || "-"}` : row.after}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
                {!historyLoading && !employeeHistory.length && (
                  <p className="px-4 py-8 text-center text-sm text-gray-400">ยังไม่มีประวัติของพนักงานคนนี้</p>
                )}
                {historyLoading && <p className="px-4 py-8 text-center text-sm text-gray-400">กำลังโหลดประวัติ...</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">กิจกรรมล่าสุด</h2>
            <p className="mt-1 text-sm text-gray-400">แสดงรายละเอียดจากประวัติที่ระบบบันทึกไว้</p>
          </div>
          <Link href="/dashboard/audits" className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600">
            ดูประวัติทั้งหมด
          </Link>
        </div>
        <div className="mt-3 divide-y divide-gray-100">
          {audits.map((item) => {
            const changes = auditChangeRows(item);
            return (
              <button key={item.id} type="button" onClick={() => setSelectedAudit(item)} className="block w-full py-3 text-left text-sm hover:bg-gray-50">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.employee?.displayName || "บัญชีที่ถูกลบ"}</p>
                    <p className="mt-1 text-gray-600">{auditSummary(item)}</p>
                  </div>
                  <span className="text-gray-400 whitespace-nowrap">{formatDate(item.createdAt)}</span>
                </div>
                {changes.length > 0 && (
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    {changes.map((row) => (
                      <div key={`${item.id}-${row.label}`} className="rounded-lg bg-gray-50 px-3 py-2 text-xs">
                        <p className="font-medium text-gray-600">{row.label}</p>
                        <p className="mt-1 text-gray-400">
                          {row.before ? `${row.before} -> ${row.after || "-"}` : row.after}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
          {!audits.length && <p className="text-gray-400 py-5">ยังไม่มีกิจกรรม</p>}
        </div>
      </section>

      {selectedAudit && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
          <button type="button" aria-label="ปิดรายละเอียดประวัติ" className="hidden flex-1 cursor-default sm:block" onClick={() => setSelectedAudit(null)} />
          <div className="h-full w-full overflow-y-auto bg-white p-5 shadow-2xl sm:max-w-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div>
                <h2 className="font-semibold text-gray-900">รายละเอียดประวัติ</h2>
                <p className="mt-1 text-sm text-gray-400">{auditSummary(selectedAudit)}</p>
              </div>
              <button type="button" onClick={() => setSelectedAudit(null)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <div className="grid gap-2">
                {auditDetailRows(selectedAudit).map((row) => (
                  <div key={row.label} className="rounded-xl border border-gray-100 px-4 py-3">
                    <p className="text-xs text-gray-400">{row.label}</p>
                    <p className="mt-1 text-sm font-medium text-gray-800">{row.value}</p>
                  </div>
                ))}
              </div>

              {auditChangeRows(selectedAudit).length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900">ค่าที่เปลี่ยนแปลง</h3>
                  <div className="mt-2 grid gap-2">
                    {auditChangeRows(selectedAudit).map((row) => (
                      <div key={row.label} className="rounded-xl border border-gray-100 px-4 py-3 text-sm">
                        <p className="font-medium text-gray-800">{row.label}</p>
                        <p className="mt-1 text-gray-500">{row.before ? `${row.before} -> ${row.after || "-"}` : row.after}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editingEmployee && editForm && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
          <button type="button" aria-label="ปิดหน้าต่างแก้ไข" className="hidden flex-1 cursor-default sm:block" onClick={closeEdit} />
          <form onSubmit={updateEmployee} className="h-full w-full overflow-y-auto bg-white p-5 shadow-2xl sm:max-w-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <UserCog size={22} />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">แก้ไขพนักงาน</h2>
                  <p className="text-sm text-gray-400">@{editingEmployee.username}</p>
                </div>
              </div>
              <button type="button" onClick={closeEdit} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 py-5">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">ชื่อพนักงาน</span>
                <input
                  required
                  value={editForm.displayName}
                  onChange={(event) => setEditForm({ ...editForm, displayName: event.target.value })}
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">ชื่อผู้ใช้</span>
                <input value={editingEmployee.username} disabled className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-400" />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4">
                <span>
                  <span className="block text-sm font-medium text-gray-700">สถานะบัญชี</span>
                  <span className="text-xs text-gray-400">{editForm.active ? "พนักงานเข้าสู่ระบบได้" : "พนักงานเข้าสู่ระบบไม่ได้"}</span>
                </span>
                <input
                  type="checkbox"
                  checked={editForm.active}
                  onChange={(event) => setEditForm({ ...editForm, active: event.target.checked })}
                  className="h-5 w-5"
                />
              </label>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-gray-700">บทบาท</span>
                  <span className="text-xs text-gray-400">เลือกได้หลายบทบาท</span>
                </div>
                <div className="mt-2 grid gap-2">
                  {(Object.keys(roleText) as Role[]).map((item) => (
                    <label
                      key={item}
                      className={`rounded-xl border p-3 text-sm cursor-pointer ${
                        editForm.roles.includes(item) ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-200 text-gray-500"
                      }`}
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <input type="checkbox" checked={editForm.roles.includes(item)} onChange={() => setEditForm(toggleRole(editForm, item))} />
                        {roleText[item]}
                      </span>
                      <span className="mt-1 block text-xs text-gray-400">{roleDescription[item]}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <RotateCcw size={16} />
                  รีเซ็ตรหัสผ่าน
                </span>
                <input
                  minLength={8}
                  type="password"
                  value={editForm.password}
                  onChange={(event) => setEditForm({ ...editForm, password: event.target.value })}
                  placeholder="กรอกรหัสผ่านใหม่"
                  className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400"
                />
              </label>
            </div>

            <div className="sticky bottom-0 -mx-5 border-t border-gray-100 bg-white p-5">
              <div className="flex gap-2">
                <button type="button" onClick={closeEdit} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-600">ยกเลิก</button>
                <button disabled={saving || !editForm.roles.length} className="flex-1 rounded-xl bg-[#356DDB] px-4 py-3 text-white disabled:opacity-50">
                  <span className="inline-flex items-center justify-center gap-2">
                    <Save size={17} />
                    {saving ? "กำลังบันทึก..." : "บันทึก"}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {confirmingToggle && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="font-semibold text-gray-900">{confirmingToggle.active ? "ปิดใช้งานบัญชีพนักงาน" : "เปิดใช้งานบัญชีพนักงาน"}</h2>
            <p className="mt-2 text-sm text-gray-500">
              {confirmingToggle.active
                ? `ต้องการปิดใช้งาน ${confirmingToggle.displayName} หรือไม่? ผู้ใช้นี้จะเข้าสู่ระบบไม่ได้ แต่ประวัติกิจกรรมเดิมยังอยู่`
                : `ต้องการเปิดใช้งาน ${confirmingToggle.displayName} อีกครั้งหรือไม่?`}
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirmingToggle(null)} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-600">ยกเลิก</button>
              <button
                onClick={() => toggleEmployeeStatus(confirmingToggle)}
                className={`flex-1 rounded-xl px-4 py-3 text-white ${confirmingToggle.active ? "bg-red-500" : "bg-emerald-600"}`}
              >
                {confirmingToggle.active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
