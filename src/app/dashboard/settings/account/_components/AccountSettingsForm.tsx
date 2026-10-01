"use client";


import { FormEvent, useState } from "react";
import { BadgeCheck, KeyRound, Mail, Pencil, Save, ShieldCheck, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Account = {
  id: number;
  displayName: string;
  username: string;
  email: string;
  emailVerified: boolean;
};

type Feedback = { type: "success" | "error"; text: string } | null;

function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;
  return (
    <p role={feedback.type === "error" ? "alert" : "status"} className={`mt-4 text-sm ${feedback.type === "error" ? "text-red-600" : "text-emerald-600"}`}>
      {feedback.text}
    </p>
  );
}

export default function AccountSettingsForm({ account }: { account: Account }) {
  const router = useRouter();
  const [profile, setProfile] = useState({ displayName: account.displayName, username: account.username });
  const [savedProfile, setSavedProfile] = useState(profile);
  const [profileEditing, setProfileEditing] = useState(false);
  const [email, setEmail] = useState(account.email);
  const [emailEditing, setEmailEditing] = useState(false);
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" });
  const [passwordEditing, setPasswordEditing] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);
  const [emailFeedback, setEmailFeedback] = useState<Feedback>(null);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);
  const [busy, setBusy] = useState<"profile" | "email" | "password" | null>(null);

  const normalizedEmail = email.trim().toLowerCase();
  const currentEmail = account.email.trim().toLowerCase();
  const emailAlreadyVerified = account.emailVerified && normalizedEmail === currentEmail;

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    setBusy("profile");
    setProfileFeedback(null);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "profile", ...profile }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");
      setSavedProfile(profile);
      setProfileEditing(false);
      setProfileFeedback({ type: "success", text: data.message });
      router.refresh();
    } catch (error) {
      setProfileFeedback({ type: "error", text: error instanceof Error ? error.message : "เชื่อมต่อไม่สำเร็จ" });
    } finally {
      setBusy(null);
    }
  }

  async function requestEmailVerification(event: FormEvent) {
    event.preventDefault();
    setBusy("email");
    setEmailFeedback(null);
    try {
      const response = await fetch("/api/account/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ส่งลิงก์ยืนยันไม่สำเร็จ");
      setEmail(account.email);
      setEmailEditing(false);
      setEmailFeedback({ type: "success", text: data.message });
    } catch (error) {
      setEmailFeedback({ type: "error", text: error instanceof Error ? error.message : "เชื่อมต่อไม่สำเร็จ" });
    } finally {
      setBusy(null);
    }
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault();
    setPasswordFeedback(null);
    if (password.next !== password.confirm) {
      setPasswordFeedback({ type: "error", text: "รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน" });
      return;
    }

    setBusy("password");
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "password", currentPassword: password.current, newPassword: password.next }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
      if (data.requiresLogin) {
        window.location.assign("/login");
        return;
      }
      setPassword({ current: "", next: "", confirm: "" });
      setPasswordEditing(false);
      setPasswordFeedback({ type: "success", text: data.message });
    } catch (error) {
      setPasswordFeedback({ type: "error", text: error instanceof Error ? error.message : "เชื่อมต่อไม่สำเร็จ" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
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

      <form onSubmit={saveProfile} className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600"><UserRound size={20} /></div>
            <div>
              <h3 className="font-semibold text-gray-900">ข้อมูลผู้ใช้</h3>
              <p className="mt-0.5 text-sm text-gray-400">ชื่อที่แสดงและชื่อที่ใช้เข้าสู่ระบบ</p>
            </div>
          </div>
          {!profileEditing && (
            <button type="button" onClick={() => { setProfileFeedback(null); setProfileEditing(true); }} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-600">
              <Pencil size={16} />แก้ไข
            </button>
          )}
        </div>
        <fieldset disabled={!profileEditing || busy !== null} className="mt-5 grid gap-4 sm:grid-cols-2 disabled:opacity-100">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">ชื่อ</span>
            <input required maxLength={100} autoComplete="name" value={profile.displayName} onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none disabled:bg-gray-50 disabled:text-gray-700 focus:border-blue-400" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-gray-700">ชื่อผู้ใช้</span>
            <input required minLength={3} maxLength={30} pattern="[a-z0-9._-]+" autoComplete="username" value={profile.username} onChange={(event) => setProfile({ ...profile, username: event.target.value.toLowerCase() })} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none disabled:bg-gray-50 disabled:text-gray-700 focus:border-blue-400" />
            {profileEditing && <span className="mt-1 block text-xs text-gray-400">ใช้ตัวอักษรอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง</span>}
          </label>
        </fieldset>
        <FeedbackMessage feedback={profileFeedback} />
        {profileEditing && (
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" disabled={busy !== null} onClick={() => { setProfile(savedProfile); setProfileFeedback(null); setProfileEditing(false); }} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-gray-600 disabled:opacity-50"><X size={16} />ยกเลิก</button>
            <button disabled={busy !== null} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#356DDB] px-5 py-3 text-white disabled:opacity-50">
              <Save size={17} />{busy === "profile" ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        )}
      </form>

      <form onSubmit={requestEmailVerification} className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><Mail size={20} /></div>
            <div>
              <h3 className="font-semibold text-gray-900">อีเมลบัญชี</h3>
              <p className="mt-0.5 text-sm text-gray-400">ใช้ยืนยันบัญชีและกู้รหัสผ่าน</p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${account.emailVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
              {account.emailVerified ? <BadgeCheck size={15} /> : <Mail size={14} />}
              {account.emailVerified ? "ยืนยันแล้ว" : "ยังไม่ยืนยัน"}
            </span>
            {!emailEditing && !account.emailVerified && (
              <button type="submit" disabled={busy !== null} className="inline-flex items-center gap-2 rounded-xl bg-[#356DDB] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50">
                <Mail size={16} />{busy === "email" ? "กำลังส่ง..." : "ส่งลิงก์ยืนยัน"}
              </button>
            )}
            {!emailEditing && (
              <button type="button" onClick={() => { setEmailFeedback(null); setEmailEditing(true); }} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-600">
                <Pencil size={16} />{account.emailVerified ? "แก้ไข" : "เปลี่ยนอีเมล"}
              </button>
            )}
          </div>
        </div>
        <fieldset disabled={!emailEditing || busy !== null} className="mt-5 disabled:opacity-100">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">อีเมล</span>
            <input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none disabled:bg-gray-50 disabled:text-gray-700 focus:border-blue-400" />
          </label>
        </fieldset>
        {emailEditing && <p className="mt-3 text-xs text-gray-400">หากเปลี่ยนอีเมล ระบบจะใช้อีเมลเดิมต่อไปจนกว่าคุณจะกดลิงก์ยืนยันในอีเมลใหม่</p>}
        <FeedbackMessage feedback={emailFeedback} />
        {emailEditing && (
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" disabled={busy !== null} onClick={() => { setEmail(account.email); setEmailFeedback(null); setEmailEditing(false); }} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-gray-600 disabled:opacity-50"><X size={16} />ยกเลิก</button>
            <button disabled={busy !== null || emailAlreadyVerified} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#356DDB] px-5 py-3 text-white disabled:opacity-50">
              <Save size={17} />{busy === "email" ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        )}
      </form>

      <form onSubmit={changePassword} className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><KeyRound size={20} /></div>
            <div>
              <h3 className="font-semibold text-gray-900">รหัสผ่าน</h3>
              <p className="mt-0.5 text-sm text-gray-400">เปลี่ยนรหัสผ่านสำหรับเข้าสู่ระบบ</p>
            </div>
          </div>
          {!passwordEditing && (
            <button type="button" onClick={() => { setPasswordFeedback(null); setPasswordEditing(true); }} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-blue-200 hover:text-blue-600">
              <KeyRound size={16} />เปลี่ยนรหัสผ่าน
            </button>
          )}
        </div>
        {passwordEditing && (
          <>
            <p className="mt-5 text-sm text-gray-500">หลังเปลี่ยนรหัสผ่าน ระบบจะให้ออกจากระบบทุกอุปกรณ์</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-gray-700">รหัสผ่านปัจจุบัน</span>
                <input required type="password" maxLength={128} autoComplete="current-password" value={password.current} onChange={(event) => setPassword({ ...password, current: event.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">รหัสผ่านใหม่</span>
                <input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={password.next} onChange={(event) => setPassword({ ...password, next: event.target.value })} placeholder="อย่างน้อย 8 ตัวอักษร" className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400" />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">ยืนยันรหัสผ่านใหม่</span>
                <input required type="password" minLength={8} maxLength={128} autoComplete="new-password" value={password.confirm} onChange={(event) => setPassword({ ...password, confirm: event.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-400" />
              </label>
            </div>
            <FeedbackMessage feedback={passwordFeedback} />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" disabled={busy !== null} onClick={() => { setPassword({ current: "", next: "", confirm: "" }); setPasswordFeedback(null); setPasswordEditing(false); }} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-gray-600 disabled:opacity-50"><X size={16} />ยกเลิก</button>
              <button disabled={busy !== null} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-white disabled:opacity-50">
                <ShieldCheck size={17} />{busy === "password" ? "กำลังเปลี่ยน..." : "ยืนยันเปลี่ยนรหัสผ่าน"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
