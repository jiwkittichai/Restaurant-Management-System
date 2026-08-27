"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { CheckCircle2, CreditCard, Pencil, QrCode, Save, UploadCloud, X } from "lucide-react";
import Link from "next/link";

type PromptPayMode = "MANUAL_QR" | "STRIPE";

type PaymentSettings = {
  promptPayEnabled: boolean;
  promptPayMode: PromptPayMode;
  promptPayAccountName: string;
  promptPayIdentifier: string;
  promptPayQrImageUrl: string;
  stripeEnabled: boolean;
  stripeGatewayReady: boolean;
};

const emptySettings: PaymentSettings = {
  promptPayEnabled: false,
  promptPayMode: "MANUAL_QR",
  promptPayAccountName: "",
  promptPayIdentifier: "",
  promptPayQrImageUrl: "",
  stripeEnabled: false,
  stripeGatewayReady: false,
};

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState<PaymentSettings>(emptySettings);
  const [savedSettings, setSavedSettings] = useState<PaymentSettings>(emptySettings);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/payment-settings")
      .then((response) => response.json())
      .then((data) => {
        const next = { ...emptySettings, ...data };
        setSettings(next);
        setSavedSettings(next);
      })
      .catch(() => setError("โหลดการตั้งค่าการชำระเงินไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  async function uploadQr(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("purpose", "promptpay_qr");
    try {
      const response = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "อัปโหลด QR ไม่สำเร็จ");
      setSettings((current) => ({ ...current, promptPayQrImageUrl: data.url }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "อัปโหลด QR ไม่สำเร็จ");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function save() {
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/payment-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "บันทึกการตั้งค่าไม่สำเร็จ");
      const next = { ...emptySettings, ...data };
      setSettings(next);
      setSavedSettings(next);
      setEditing(false);
      setMessage("บันทึกการตั้งค่าการชำระเงินแล้ว");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "บันทึกการตั้งค่าไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">กำลังโหลดการตั้งค่า...</div>;
  const disabled = !editing || saving || uploading;

  return (
    <div className="space-y-6 p-4 lg:p-6">
      <section className="rounded-2xl border border-gray-100 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/dashboard/settings" className="text-sm font-medium text-blue-600">ตั้งค่า</Link>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">การชำระเงิน</h2>
            <p className="mt-1 text-sm text-gray-400">กำหนดวิธีรับเงินของร้านสำหรับหน้าเช็คบิล</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${settings.promptPayEnabled ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}>
              {settings.promptPayEnabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
            </span>
            {!editing ? (
              <button onClick={() => { setMessage(""); setError(""); setEditing(true); }} className="rounded-xl bg-[#356DDB] px-4 py-2.5 text-sm font-semibold text-white">
                <span className="inline-flex items-center gap-2"><Pencil size={16} />แก้ไข</span>
              </button>
            ) : (
              <button onClick={() => { setSettings(savedSettings); setEditing(false); setMessage(""); setError(""); }} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600">
                <span className="inline-flex items-center gap-2"><X size={16} />ยกเลิก</span>
              </button>
            )}
          </div>
        </div>
        {editing && (
          <label className="mt-5 inline-flex cursor-pointer items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={settings.promptPayEnabled}
              onChange={(event) => setSettings({ ...settings, promptPayEnabled: event.target.checked })}
              className="h-5 w-5 accent-blue-600"
            />
            เปิดรับชำระ PromptPay
          </label>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <button
          type="button"
          disabled={!editing}
          onClick={() => setSettings({ ...settings, promptPayMode: "MANUAL_QR" })}
          className={`rounded-2xl border bg-white p-5 text-left transition disabled:cursor-default ${settings.promptPayMode === "MANUAL_QR" ? "border-blue-300 bg-blue-50 shadow-sm" : editing ? "border-gray-100 hover:border-blue-100" : "border-gray-100 opacity-60"}`}
        >
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-blue-600"><QrCode size={22} /></div>
            <div>
              <h3 className="font-semibold text-gray-900">QR พร้อมเพย์ของร้าน</h3>
              <p className="mt-1 text-sm text-gray-500">แสดง QR ที่ร้านอัปโหลด แล้วกดยืนยันหลังลูกค้าจ่าย</p>
            </div>
          </div>
        </button>

        <button
          type="button"
          disabled={!editing}
          onClick={() => setSettings({ ...settings, promptPayMode: "STRIPE", stripeEnabled: true })}
          className={`rounded-2xl border bg-white p-5 text-left transition disabled:cursor-default ${settings.promptPayMode === "STRIPE" ? "border-blue-300 bg-blue-50 shadow-sm" : editing ? "border-gray-100 hover:border-blue-100" : "border-gray-100 opacity-60"}`}
        >
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-700"><CreditCard size={22} /></div>
            <div>
              <h3 className="font-semibold text-gray-900">Stripe PromptPay</h3>
              <p className="mt-1 text-sm text-gray-500">สร้าง QR ตามยอดบิลและตรวจสอบการชำระเงินอัตโนมัติ</p>
            </div>
          </div>
          {!settings.stripeGatewayReady && (
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
              ยังไม่ได้ตั้งค่า STRIPE_SECRET_KEY บน server
            </p>
          )}
        </button>
      </section>

      <section className="grid gap-5 rounded-2xl border border-gray-100 bg-white p-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-600">
              ชื่อบัญชีรับเงิน
              <input
                value={settings.promptPayAccountName}
                onChange={(event) => setSettings({ ...settings, promptPayAccountName: event.target.value })}
                disabled={disabled}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </label>
            <label className="text-sm font-medium text-gray-600">
              เลขบัญชี / เบอร์พร้อมเพย์
              <input
                value={settings.promptPayIdentifier}
                onChange={(event) => setSettings({ ...settings, promptPayIdentifier: event.target.value })}
                disabled={disabled}
                className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-900 outline-none focus:border-blue-400 disabled:bg-gray-50 disabled:text-gray-500"
              />
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-600">รูป QR พร้อมเพย์</p>
            <label className={`inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium transition ${editing ? "cursor-pointer text-gray-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600" : "cursor-default bg-gray-50 text-gray-400"}`}>
              <UploadCloud size={17} />
              {uploading ? "กำลังอัปโหลด..." : "อัปโหลดรูป QR"}
              <input type="file" accept="image/*" onChange={uploadQr} disabled={!editing || uploading} className="hidden" />
            </label>
          </div>

          {message && <p className="text-sm font-medium text-emerald-600">{message}</p>}
          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
          <p className="mb-3 text-sm font-semibold text-gray-900">ตัวอย่างที่จะแสดงตอนเช็คบิล</p>
          <div className="grid min-h-64 place-items-center rounded-xl bg-white p-3">
            {settings.promptPayQrImageUrl ? (
              <img src={settings.promptPayQrImageUrl} alt="QR พร้อมเพย์" className="max-h-56 max-w-full object-contain" />
            ) : (
              <QrCode size={72} className="text-gray-200" />
            )}
          </div>
          <p className="mt-3 truncate text-sm font-semibold text-gray-900">{settings.promptPayAccountName || "ชื่อบัญชีรับเงิน"}</p>
          <p className="text-xs text-gray-400">{settings.promptPayIdentifier || "เลขบัญชี / เบอร์พร้อมเพย์"}</p>
        </div>
      </section>

      <div className="flex justify-end">
        <button onClick={save} disabled={!editing || saving || uploading} className="rounded-xl bg-[#356DDB] px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">
          <span className="inline-flex items-center gap-2">{message ? <CheckCircle2 size={17} /> : <Save size={17} />}{saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}</span>
        </button>
      </div>
    </div>
  );
}
