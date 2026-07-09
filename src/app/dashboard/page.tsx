"use client";

import React, { useEffect, useState } from "react";
import { ChefHat, CircleDollarSign, LayoutGrid, UtensilsCrossed } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState({ menu: 0, availableTables: 0, activeOrders: 0, sales: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/menu").then((r) => r.json()),
      fetch("/api/tables").then((r) => r.json()),
      fetch("/api/orders?view=history").then((r) => r.json()),
    ]).then(([menu, tables, orders]) => setData({
      menu: menu.length,
      availableTables: tables.filter((t: { status: string }) => t.status === "AVAILABLE").length,
      activeOrders: orders.filter((o: { status: string }) => !["SERVED", "CANCELLED"].includes(o.status)).length,
      sales: orders.filter((o: { paymentStatus: string }) => o.paymentStatus === "PAID").reduce((sum: number, o: { total: number }) => sum + o.total, 0),
    })).catch(() => undefined);
  }, []);

  const cards = [
    { label: "เมนูทั้งหมด", value: data.menu, icon: UtensilsCrossed, color: "bg-blue-50 text-blue-600" },
    { label: "โต๊ะว่าง", value: data.availableTables, icon: LayoutGrid, color: "bg-emerald-50 text-emerald-600" },
    { label: "ออเดอร์กำลังทำ", value: data.activeOrders, icon: ChefHat, color: "bg-amber-50 text-amber-600" },
    { label: "ยอดขายสะสม", value: `฿${data.sales.toLocaleString()}`, icon: CircleDollarSign, color: "bg-violet-50 text-violet-600" },
  ];
  return (
    <div className="min-h-full p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}><Icon size={24} /></div>
            <div><p className="text-sm text-gray-400 font-light">{label}</p><p className="text-2xl font-semibold text-gray-800">{value}</p></div>
          </div>
        ))}
      </div>
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-8">
        <h2 className="text-lg font-semibold text-gray-800">เริ่มต้นใช้งาน</h2>
        <p className="text-gray-500 font-light mt-2">เพิ่มหมวดหมู่และเมนูอาหาร จากนั้นสร้างโต๊ะเพื่อเริ่มรับออเดอร์ เมนูที่ส่งแล้วจะแสดงบนหน้าจอครัวทันที</p>
      </div>
    </div>
  );
}
