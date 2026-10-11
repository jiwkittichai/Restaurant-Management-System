import type { DashboardRole } from "./roles";

export type DashboardIconName =
  | "House"
  | "ShoppingCart"
  | "ShoppingBag"
  | "LayoutGrid"
  | "ChefHat"
  | "PackageOpen"
  | "BookOpenText"
  | "UtensilsCrossed"
  | "Tags"
  | "ChartNoAxesCombined"
  | "Users"
  | "Settings";

type DashboardSection = {
  path: string;
  pageTitle: string;
  roles: readonly DashboardRole[];
  sidebar?: {
    label: string;
    icon: DashboardIconName;
    order: number;
  };
};

export const dashboardSections: readonly DashboardSection[] = [
  {
    path: "/dashboard/employees",
    pageTitle: "จัดการพนักงาน",
    roles: ["OWNER"],
    sidebar: { label: "จัดการพนักงาน", icon: "Users", order: 10 },
  },
  {
    path: "/dashboard/audits",
    pageTitle: "ประวัติกิจกรรม",
    roles: ["OWNER"],
  },
  {
    path: "/dashboard/reports",
    pageTitle: "รายงานยอดขาย",
    roles: ["OWNER"],
    sidebar: {
      label: "รายงานยอดขาย",
      icon: "ChartNoAxesCombined",
      order: 9,
    },
  },
  {
    path: "/dashboard/settings",
    pageTitle: "ตั้งค่า",
    roles: ["OWNER"],
    sidebar: { label: "ตั้งค่า", icon: "Settings", order: 11 },
  },
  {
    path: "/dashboard/categories",
    pageTitle: "หมวดหมู่เมนู",
    roles: ["OWNER"],
    sidebar: { label: "หมวดหมู่", icon: "Tags", order: 8 },
  },
  {
    path: "/dashboard/products",
    pageTitle: "เมนูอาหาร",
    roles: ["OWNER"],
    sidebar: { label: "เมนูอาหาร", icon: "UtensilsCrossed", order: 7 },
  },
  {
    path: "/dashboard/recipes",
    pageTitle: "สูตรอาหาร",
    roles: ["OWNER", "STOCK"],
    sidebar: { label: "สูตรอาหาร", icon: "BookOpenText", order: 6 },
  },
  {
    path: "/dashboard/inventory",
    pageTitle: "สต็อกและสูตรอาหาร",
    roles: ["OWNER", "STOCK"],
    sidebar: { label: "สต็อกวัตถุดิบ", icon: "PackageOpen", order: 5 },
  },
  {
    path: "/dashboard/kitchen",
    pageTitle: "หน้าจอครัว",
    roles: ["OWNER", "KITCHEN"],
    sidebar: { label: "หน้าจอครัว", icon: "ChefHat", order: 4 },
  },
  {
    path: "/dashboard/tables",
    pageTitle: "จัดการโต๊ะ",
    roles: ["OWNER", "CASHIER"],
    sidebar: { label: "โต๊ะอาหาร", icon: "LayoutGrid", order: 3 },
  },
  {
    path: "/dashboard/takeaway",
    pageTitle: "คิวซื้อกลับบ้าน",
    roles: ["OWNER", "CASHIER"],
    sidebar: { label: "คิวซื้อกลับบ้าน", icon: "ShoppingBag", order: 2 },
  },
  {
    path: "/dashboard/orders",
    pageTitle: "รับออเดอร์",
    roles: ["OWNER", "CASHIER"],
    sidebar: { label: "รับออเดอร์", icon: "ShoppingCart", order: 1 },
  },
  {
    path: "/dashboard",
    pageTitle: "ภาพรวมร้านอาหาร",
    roles: ["OWNER"],
    sidebar: { label: "แดชบอร์ด", icon: "House", order: 0 },
  },
];

const exactPageTitles: Record<string, string> = {
  "/dashboard/onboarding": "เริ่มต้นใช้งาน",
  "/dashboard/products/create": "เพิ่มเมนูอาหาร",
  "/dashboard/settings/account": "บัญชีผู้ใช้",
  "/dashboard/settings/restaurant": "ข้อมูลร้าน",
  "/dashboard/settings/payments": "ตั้งค่า",
  "/dashboard/employees/create": "เพิ่มพนักงาน",
};

export const dashboardSidebarItems = dashboardSections
  .flatMap((section) =>
    section.sidebar
      ? [
          {
            name: section.sidebar.label,
            path: section.path,
            icon: section.sidebar.icon,
            roles: section.roles,
            order: section.sidebar.order,
          },
        ]
      : [],
  )
  .sort((left, right) => left.order - right.order);

export function findDashboardSection(pathname: string) {
  // The most specific section wins, regardless of sidebar/configuration order.
  let match: DashboardSection | undefined;
  for (const section of dashboardSections) {
    if (
      (pathname === section.path || pathname.startsWith(`${section.path}/`)) &&
      (!match || section.path.length > match.path.length)
    ) {
      match = section;
    }
  }
  return match;
}

export function getDashboardPageTitle(pathname: string) {
  if (exactPageTitles[pathname]) return exactPageTitles[pathname];
  if (pathname.startsWith("/dashboard/audits/")) {
    return "รายละเอียดประวัติ";
  }
  if (/^\/dashboard\/employees\/\d+\/edit$/.test(pathname)) {
    return "แก้ไขพนักงาน";
  }
  if (/^\/dashboard\/employees\/\d+\/history$/.test(pathname)) {
    return "ประวัติพนักงาน";
  }
  if (/^\/dashboard\/products\/[^/]+\/edit$/.test(pathname)) {
    return "แก้ไขเมนูอาหาร";
  }
  if (/^\/dashboard\/reports\/orders\/[^/]+$/.test(pathname)) {
    return "รายละเอียดออเดอร์";
  }
  return findDashboardSection(pathname)?.pageTitle || "จัดการร้านอาหาร";
}
