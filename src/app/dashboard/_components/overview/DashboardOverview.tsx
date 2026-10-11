"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChefHat,
  CircleDollarSign,
  LayoutGrid,
  Percent,
  ReceiptText,
  SquareMenu,
  UtensilsCrossed,
  WalletCards,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Employee, MenuItem, Order, TableItem } from "./types";
import { isToday, money } from "./utils";
import SummaryCards from "./SummaryCards";
import TodayEmployees from "./TodayEmployees";
import TopMenus, { type TopMenu } from "./TopMenus";
import LoadErrorMessage from "../LoadErrorMessage";
import { fetchJson } from "@/lib/client-fetch";

export default function DashboardOverview() {
  const router = useRouter();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadError, setLoadError] = useState("");

  const loadDashboard = useCallback(async () => {
    const results = await Promise.allSettled([
      fetchJson("/api/menu"),
      fetchJson("/api/tables"),
      fetchJson("/api/orders?view=history"),
      fetchJson("/api/employees"),
    ]);
    const [menuResult, tableResult, orderResult, employeeResult] = results;
    let failed = false;

    if (menuResult.status === "fulfilled" && Array.isArray(menuResult.value))
      setMenu(menuResult.value as MenuItem[]);
    else failed = true;
    if (tableResult.status === "fulfilled" && Array.isArray(tableResult.value))
      setTables(tableResult.value as TableItem[]);
    else failed = true;
    if (orderResult.status === "fulfilled" && Array.isArray(orderResult.value))
      setOrders(orderResult.value as Order[]);
    else failed = true;
    if (
      employeeResult.status === "fulfilled" &&
      employeeResult.value &&
      typeof employeeResult.value === "object" &&
      "employees" in employeeResult.value &&
      Array.isArray(employeeResult.value.employees)
    ) {
      setEmployees(employeeResult.value.employees as Employee[]);
    } else failed = true;

    if (failed) {
      console.error(
        "Failed to load some dashboard data",
        results.filter((result) => result.status === "rejected"),
      );
      setLoadError(
        "โหลดข้อมูลภาพรวมบางส่วนไม่สำเร็จ ข้อมูลส่วนที่โหลดได้ยังคงแสดงอยู่",
      );
    } else setLoadError("");
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const paidOrders = useMemo(
    () => orders.filter((order) => order.paymentStatus === "PAID"),
    [orders],
  );
  const todayOrders = useMemo(
    () => paidOrders.filter((order) => isToday(order.createdAt)),
    [paidOrders],
  );
  const allTimeSales = paidOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0,
  );
  const todaySales = todayOrders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0,
  );
  const todayDiscount = todayOrders.reduce(
    (sum, order) => sum + Number(order.discount || 0),
    0,
  );
  const averageBill = todayOrders.length ? todaySales / todayOrders.length : 0;

  const topMenus = useMemo<TopMenu[]>(() => {
    const summary = new Map<string, TopMenu>();
    for (const order of todayOrders) {
      for (const item of order.items || []) {
        const current = summary.get(item.name) || {
          name: item.name,
          qty: 0,
          total: 0,
        };
        current.qty += Number(item.qty || 0);
        current.total += Number(item.qty || 0) * Number(item.price || 0);
        summary.set(item.name, current);
      }
    }
    return [...summary.values()]
      .sort((a, b) => b.qty - a.qty || b.total - a.total)
      .slice(0, 6);
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
      value: orders.filter(
        (order) => !["SERVED", "CANCELLED"].includes(order.status),
      ).length,
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

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden p-3 sm:space-y-5 sm:p-6">
      <LoadErrorMessage message={loadError} onRetry={loadDashboard} />
      <SummaryCards cards={summaryCards} />
      <SummaryCards
        cards={todayCards}
        title="ยอดขายวันนี้"
        description="สรุปยอดขาย จำนวนบิล ค่าเฉลี่ย และส่วนลดของวันที่เปิดใช้งานอยู่"
      />
      <section className="grid gap-5 lg:grid-cols-2">
        <TopMenus items={topMenus} />
        <TodayEmployees
          employees={employees.slice(0, 6)}
          onManage={() => router.push("/dashboard/employees")}
          onHistory={(employee) =>
            router.push(`/dashboard/employees/${employee.id}/history`)
          }
        />
      </section>
    </div>
  );
}
