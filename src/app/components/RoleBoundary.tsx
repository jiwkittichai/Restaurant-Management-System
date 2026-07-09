"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

const access: Array<{ prefix: string; roles: string[] }> = [
  { prefix: "/dashboard/employees", roles: ["OWNER"] },
  { prefix: "/dashboard/reports", roles: ["OWNER"] },
  { prefix: "/dashboard/categories", roles: ["OWNER"] },
  { prefix: "/dashboard/products", roles: ["OWNER"] },
  { prefix: "/dashboard/inventory", roles: ["OWNER", "STOCK"] },
  { prefix: "/dashboard/kitchen", roles: ["OWNER", "KITCHEN"] },
  { prefix: "/dashboard/tables", roles: ["OWNER", "CASHIER"] },
  { prefix: "/dashboard/takeaway", roles: ["OWNER", "CASHIER"] },
  { prefix: "/dashboard/orders", roles: ["OWNER", "CASHIER"] },
  { prefix: "/dashboard", roles: ["OWNER"] },
];

function landing(roles: string[]) {
  if (roles.includes("OWNER")) return "/dashboard";
  if (roles.includes("CASHIER")) return "/dashboard/orders";
  if (roles.includes("KITCHEN")) return "/dashboard/kitchen";
  return "/dashboard/inventory";
}

export default function RoleBoundary({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const rule = access.find((item) => pathname === item.prefix || pathname.startsWith(`${item.prefix}/`));
  const allowed = !rule || roles.some((role) => rule.roles.includes(role));
  useEffect(() => { if (!allowed) router.replace(landing(roles)); }, [allowed, roles, router]);
  if (!allowed) return <div className="p-10 text-center text-gray-400">กำลังนำไปยังหน้าที่ได้รับอนุญาต...</div>;
  return children;
}
