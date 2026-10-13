/**
 * EmployeesPageClient ดูแลข้อมูลและการทำงานหลักของหน้าพนักงาน
 * ใช้จัดการข้อมูลบนหน้าจอ ติดต่อ API และแจ้งผลสำเร็จหรือข้อผิดพลาดให้ผู้ใช้
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Employee, Role } from "../types";
import EmployeeList from "./EmployeeList";
import EmployeesHeader from "./EmployeesHeader";
import EmployeeStatusDialog from "./EmployeeStatusDialog";
import LoadErrorMessage from "../../_components/LoadErrorMessage";

type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

export default function EmployeesPageClient() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ACTIVE");
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [confirmingToggle, setConfirmingToggle] = useState<Employee | null>(null);

  const load = useCallback(
    () =>
      fetch("/api/employees")
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error);
          if (!Array.isArray(data.employees)) throw new Error("รูปแบบข้อมูลพนักงานไม่ถูกต้อง");
          setEmployees(data.employees);
          setLoadError("");
        })
        .catch((loadFailure) => {
          console.error("Failed to load employees", loadFailure);
          setLoadError("โหลดข้อมูลพนักงานไม่สำเร็จ ข้อมูลเดิมยังคงแสดงอยู่");
        }),
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

  return (
    <div className="space-y-6 overflow-y-auto p-4 sm:p-6">
      <EmployeesHeader totalCount={employees.length} activeCount={activeCount} />

      {message && <p className={`text-sm ${message.includes("แล้ว") ? "text-emerald-600" : "text-red-500"}`}>{message}</p>}
      <LoadErrorMessage message={loadError} onRetry={load} />

      <EmployeeList
        employees={filteredEmployees}
        query={query}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onQuery={setQuery}
        onRoleFilter={setRoleFilter}
        onStatusFilter={setStatusFilter}
        onToggle={setConfirmingToggle}
      />

      {confirmingToggle && (
        <EmployeeStatusDialog
          employee={confirmingToggle}
          onClose={() => setConfirmingToggle(null)}
          onConfirm={() => toggleEmployeeStatus(confirmingToggle)}
        />
      )}
    </div>
  );
}
