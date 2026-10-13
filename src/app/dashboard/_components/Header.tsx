/**
 * Header แสดงหัวข้อและคำสั่งหลักของแดชบอร์ดร้านอาหาร
 * ใช้รับข้อมูลจากส่วนอื่นและจัดการการโต้ตอบที่จำเป็นบนหน้าจอ
 */

"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { getDashboardPageTitle } from "../navigation";
import NotificationCenter from "./NotificationCenter";
import UserProfileMenu from "./UserProfileMenu";

type HeaderUser = {
  displayName: string;
  username: string;
  roles: string[];
};

export default function Header({
  user,
  restaurantName,
  onOpenNavigation,
}: {
  restaurantName?: string;
  user: HeaderUser;
  onOpenNavigation?: () => void;
}) {
  const pathname = usePathname();
  const pageTitle = getDashboardPageTitle(pathname);

  return (
    <div className="flex w-full items-center justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5 lg:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenNavigation}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-[#356DDB] transition-colors hover:bg-[#E8EFFF] min-[480px]:hidden"
          aria-label="เปิดเมนูหลัก"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm text-gray-400">
            {restaurantName || "Restaurant Management System"}
          </p>
          <h1 className="truncate text-xl font-semibold leading-tight text-[#1e1e1e]">
            {pageTitle}
          </h1>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-4">
        <NotificationCenter roles={user.roles} />
        <UserProfileMenu user={user} />
      </div>
    </div>
  );
}
