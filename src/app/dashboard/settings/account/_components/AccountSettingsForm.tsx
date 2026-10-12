"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import type { Account, AccountTask } from "../types";
import EmailForm from "./EmailForm";
import PasswordForm from "./PasswordForm";
import ProfileForm from "./ProfileForm";
import SettingsBackLink from "../../SettingsBackLink";

export default function AccountSettingsForm({ account }: { account: Account }) {
  const [busyTask, setBusyTask] = useState<AccountTask>(null);

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <SettingsBackLink />
      <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <UserRound size={22} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">บัญชีผู้ใช้</h2>
            <p className="mt-1 text-sm text-gray-500">จัดการข้อมูลบัญชีเจ้าของร้านที่กำลังเข้าสู่ระบบ</p>
          </div>
        </div>
      </section>

      <ProfileForm account={account} busyTask={busyTask} onBusyTask={setBusyTask} />
      <EmailForm account={account} busyTask={busyTask} onBusyTask={setBusyTask} />
      <PasswordForm busyTask={busyTask} onBusyTask={setBusyTask} />
    </div>
  );
}
