"use client";

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
}: {
  restaurantName?: string;
  user: HeaderUser;
}) {
  const pathname = usePathname();
  const pageTitle = getDashboardPageTitle(pathname);

  return (
    <div className="flex w-full items-center justify-between px-6 py-5 lg:px-10">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-gray-400">
          {restaurantName || "Restaurant Management System"}
        </p>
        <h1 className="text-xl font-semibold leading-tight text-[#1e1e1e]">
          {pageTitle}
        </h1>
      </div>

      <div className="flex min-w-0 items-center gap-4">
        <NotificationCenter roles={user.roles} />
        <UserProfileMenu user={user} />
      </div>
    </div>
  );
}
