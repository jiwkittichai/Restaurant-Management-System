"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChefHat,
  CircleDollarSign,
  Eye,
  LayoutGrid,
  Percent,
  ReceiptText,
  SquareMenu,
  UtensilsCrossed,
  WalletCards,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { roleText } from "./audit-utils";

type MenuItem = {
  id: number;
  name: string;
  price: number;
};

type TableItem = {
  status: string;
};

type OrderItem = {
  name: string;
  price: number;
  qty: number;
};

type Order = {
  status: string;
  paymentStatus: string;
  total: number;
  discount?: number;
  createdAt: string;
  items?: OrderItem[];
};

type Role = "OWNER" | "CASHIER" | "KITCHEN" | "STOCK";

type Employee = {
  id: number;
  username: string;
  displayName: string;
  active: boolean;
  lastLoginAt?: string | null;
  roles: Role[];
};

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function money(value: number, decimals = 0) {
  return `฿${value.toLocaleString("th-TH", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function formatLogin(value?: string | null) {
  if (!value) return "ยังไม่เคยเข้าสู่ระบบ";
  return new Date(value).toLocaleString("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function primaryRole(roles: Role[]) {
  return roles[0] ? roleText[roles[0]] || roles[0] : "พนักงาน";
}

export default function DashboardPage() {
  const router = useRouter();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const loadDashboard = useCallback(() => {
    Promise.allSettled([
      fetch("/api/menu").then((response) => response.json()),
      fetch("/api/tables").then((response) => response.json()),
      fetch("/api/orders?view=history").then((response) => response.json()),
      fetch("/api/employees").then((response) => response.json()),
    ]).then(([menuResult, tableResult, orderResult, employeeResult]) => {
      if (menuResult.status === "fulfilled" && Array.isArray(menuResult.value)) {
        setMenu(menuResult.value);
      }
      if (tableResult.status === "fulfilled" && Array.isArray(tableResult.value)) {
        setTables(tableResult.value);
      }
      if (orderResult.status === "fulfilled" && Array.isArray(orderResult.value)) {
        setOrders(orderResult.value);
      }
      if (
        employeeResult.status === "fulfilled" &&
        employeeResult.value &&
        Array.isArray(employeeResult.value.employees)
      ) {
        setEmployees(employeeResult.value.employees);
      }
    });
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  function openEmployeeHistory(employee: Employee) {
    router.push(`/dashboard/employees/${employee.id}/history`);
  }

  const paidOrders = useMemo(
    () => orders.filter((order) => order.paymentStatus === "PAID"),
    [orders],
  );

  const todayOrders = useMemo(
    () => paidOrders.filter((order) => isToday(order.createdAt)),
    [paidOrders],
  );

  const allTimeSales = paidOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const todaySales = todayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const todayDiscount = todayOrders.reduce((sum, order) => sum + Number(order.discount || 0), 0);
  const averageBill = todayOrders.length ? todaySales / todayOrders.length : 0;

  const topMenus = useMemo(() => {
    const summary = new Map<string, { name: string; qty: number; total: number }>();
    for (const order of todayOrders) {
      for (const item of order.items || []) {
        const current = summary.get(item.name) || { name: item.name, qty: 0, total: 0 };
        current.qty += Number(item.qty || 0);
        current.total += Number(item.qty || 0) * Number(item.price || 0);
        summary.set(item.name, current);
      }
    }

    const ranked = [...summary.values()]
      .sort((a, b) => b.qty - a.qty || b.total - a.total)
      .slice(0, 6);

    return ranked;
  }, [todayOrders]);

  const summaryCards = [
    {
      label: "เมนูทั้งหมด",
      value: menu.length,
      icon: UtensilsCrossed,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "โต๊ะว่าง",
      value: tables.filter((table) => table.status === "AVAILABLE").length,
      icon: LayoutGrid,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "ออเดอร์กำลังทำ",
      value: orders.filter((order) => !["SERVED", "CANCELLED"].includes(order.status)).length,
      icon: ChefHat,
      tone: "bg-amber-50 text-amber-500",
    },
    {
      label: "ยอดขายสะสม",
      value: money(allTimeSales),
      icon: CircleDollarSign,
      tone: "bg-fuchsia-50 text-fuchsia-600",
    },
  ];

  const todayCards = [
    {
      label: "ยอดขาย",
      value: money(todaySales, 2),
      icon: WalletCards,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "จำนวนบิล",
      value: todayOrders.length,
      icon: ReceiptText,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "ยอดเฉลี่ยต่อบิล",
      value: money(averageBill, 2),
      icon: SquareMenu,
      tone: "bg-violet-50 text-violet-600",
    },
    {
      label: "ส่วนลดรวม",
      value: money(todayDiscount, 2),
      icon: Percent,
      tone: "bg-amber-50 text-amber-600",
    },
  ];

  const visibleEmployees = employees.slice(0, 6);

  return (
    <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5"
          >
            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
              <Icon size={21} />
            </div>
            <div>
              <p className="text-sm text-gray-400">{label}</p>
              <p className="text-xl font-semibold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 p-5">
        <div>
          <h2 className="font-semibold text-gray-900">ยอดขายวันนี้</h2>
          <p className="mt-1 text-sm text-gray-400">สรุปยอดขาย จำนวนบิล ค่าเฉลี่ย และส่วนลดของวันที่เปิดใช้งานอยู่</p>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {todayCards.map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-5"
            >
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
                <Icon size={21} />
              </div>
              <div>
                <p className="text-sm text-gray-400">{label}</p>
                <p className="text-xl font-semibold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <h2 className="font-semibold text-gray-900">เมนูขายดีวันนี้</h2>
          <div className="mt-4 space-y-3">
            {topMenus.map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-xs text-blue-600">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.qty} รายการ</p>
                </div>
                <span className="font-medium text-gray-900">{money(item.total, 2)}</span>
              </div>
            ))}
            {!topMenus.length && <p className="text-sm text-gray-400">ยังไม่มีข้อมูลเมนูขายดีวันนี้</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">รายชื่อพนักงานวันนี้</h2>
            </div>
            <button
              type="button"
              onClick={() => router.push("/dashboard/employees")}
              className="w-fit rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:border-blue-100 hover:bg-blue-50 hover:text-blue-600"
            >
              จัดการทั้งหมด
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="p-3 text-left font-medium">พนักงาน</th>
                  <th className="p-3 text-left font-medium">บทบาท</th>
                  <th className="p-3 text-left font-medium">เข้าสู่ระบบล่าสุด</th>
                  <th className="p-3 text-center font-medium">สถานะ</th>
                  <th className="p-3 text-center font-medium">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {visibleEmployees.map((employee) => (
                  <tr key={employee.id} className="border-t border-gray-100">
                    <td className="p-3 align-middle">
                      <p className="font-medium text-gray-900">{employee.displayName}</p>
                      <p className="text-xs text-gray-400">@{employee.username}</p>
                    </td>
                    <td className="p-3 align-middle">
                      <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600">
                        {primaryRole(employee.roles)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap p-3 align-middle text-gray-500">
                      {formatLogin(employee.lastLoginAt)}
                    </td>
                    <td className="p-3 text-center align-middle">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs ${
                          employee.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {employee.active ? "ใช้งาน" : "ปิดใช้งาน"}
                      </span>
                    </td>
                    <td className="p-3 align-middle">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          title="ดูประวัติรายบุคคล"
                          onClick={() => openEmployeeHistory(employee)}
                          className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!visibleEmployees.length && (
                  <tr>
                    <td className="py-10 text-center text-gray-400" colSpan={5}>
                      ยังไม่มีข้อมูลพนักงาน
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

    </div>
  );
}
