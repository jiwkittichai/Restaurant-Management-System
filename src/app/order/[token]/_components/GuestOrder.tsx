/**
 * GuestOrder ควบคุมหน้าสั่งอาหารผ่าน QR ของลูกค้า
 * ใช้จัดการข้อมูลบนหน้าจอ ติดต่อ API และแจ้งผลสำเร็จหรือข้อผิดพลาดให้ผู้ใช้
 */

"use client";

import { CheckCircle2, ShoppingBag, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CartLine,
  GuestOrderData,
  GuestTab,
  ModifierGroup,
  ModifierOption,
} from "../types";
import { cartLinePrice, createGuestId, guestMoney } from "../utils";
import GuestCartDialog from "./GuestCartDialog";
import GuestMenuCatalog from "./GuestMenuCatalog";
import GuestSubmittedOrders from "./GuestSubmittedOrders";

export default function GuestOrder({ token }: { token: string }) {
  const [data, setData] = useState<GuestOrderData | null>(null);
  const [guest, setGuest] = useState("");
  const [closed, setClosed] = useState(false);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState<GuestTab>("menu");
  const [category, setCategory] = useState(0);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [editing, setEditing] = useState<CartLine | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const pending = useRef<{ requestId: string; fingerprint: string } | null>(
    null,
  );
  const storageKey = `qr-table-${token}`;

  useEffect(() => {
    let id = createGuestId();
    try {
      id = localStorage.getItem(`${storageKey}-guest`) || id;
      localStorage.setItem(`${storageKey}-guest`, id);
      const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved) {
        setCart(saved.cart || []);
        pending.current = saved.pending || null;
      }
    } catch {
      // Storage may be unavailable; ordering still works for this page.
    }
    setGuest(id);
  }, [storageKey]);

  const load = useCallback(async () => {
    if (!guest) return;
    try {
      const response = await fetch(`/api/guest/${token}?guestId=${guest}`, {
        cache: "no-store",
      });
      const result = await response.json();
      if (response.status === 410) {
        setClosed(true);
        setData(null);
        return;
      }
      if (!response.ok) throw new Error(result.error);
      setData(result);
      document.title = `${result.restaurantName} · สั่งอาหาร`;
    } catch {
      setMessage("เชื่อมต่อร้านไม่สำเร็จ กำลังลองเชื่อมต่อใหม่");
    }
  }, [guest, token]);

  useEffect(() => {
    void load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!guest) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ cart, pending: pending.current }),
      );
    } catch {
      // Storage may be unavailable; keep the in-memory cart.
    }
  }, [cart, guest, storageKey]);

  const blocked = closed || !!data?.paused || !!data?.billRequestedAt;
  const total = cart.reduce(
    (sum, line) => sum + cartLinePrice(line) * line.qty,
    0,
  );

  function selectOption(option: ModifierOption, group: ModifierGroup) {
    if (!editing) return;
    const selected = editing.modifierIds.includes(option.id);
    const groupIds = group.options.map((item) => item.id);
    let ids = editing.modifierIds.filter((id) => !selected || id !== option.id);
    if (!selected) {
      if (group.maxSelect === 1) {
        ids = ids.filter((id) => !groupIds.includes(id));
      } else if (
        ids.filter((id) => groupIds.includes(id)).length >= group.maxSelect
      ) {
        setMessage(
          `เลือก ${group.name} ได้ไม่เกิน ${group.maxSelect} ตัวเลือก`,
        );
        return;
      }
      ids.push(option.id);
    }
    setEditing({ ...editing, modifierIds: ids });
  }

  function saveLine() {
    if (!editing) return;
    for (const group of editing.menu.modifierGroups) {
      const count = group.options.filter((option) =>
        editing.modifierIds.includes(option.id),
      ).length;
      if (count < group.minSelect || count > group.maxSelect) {
        setMessage(
          `กรุณาเลือก ${group.name} ${group.minSelect}–${group.maxSelect} ตัวเลือก`,
        );
        return;
      }
    }
    setCart((lines) => [
      ...lines.filter((line) => line.key !== editing.key),
      editing,
    ]);
    setEditing(null);
    setMessage("");
  }

  async function submit() {
    if (sending.current || blocked || !cart.length) return;
    sending.current = true;
    setBusy(true);
    setMessage("");
    const items = cart.map((line) => ({
      menuItemId: line.menu.id,
      qty: line.qty,
      note: line.note,
      modifierIds: line.modifierIds,
    }));
    const fingerprint = JSON.stringify(items);
    if (!pending.current || pending.current.fingerprint !== fingerprint) {
      pending.current = { requestId: createGuestId(), fingerprint };
    }
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ cart, pending: pending.current }),
      );
    } catch {
      // Storage may be unavailable; the request can still be submitted.
    }

    try {
      const response = await fetch(`/api/guest/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          guestId: guest,
          requestId: pending.current.requestId,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 410) setClosed(true);
        throw new Error(result.error);
      }
      pending.current = null;
      setCart([]);
      setShowCart(false);
      setTab("mine");
      setMessage("ส่งอาหารเข้าครัวแล้ว สั่งเพิ่มได้จากหน้าเมนู");
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "ยังยืนยันผลไม่ได้ กดส่งอีกครั้งเพื่อตรวจสอบรายการเดิม",
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }

  async function requestBill() {
    setBusy(true);
    try {
      const response = await fetch(`/api/guest/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bill" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setMessage("แจ้งพนักงานแล้ว กรุณารอชำระเงินที่โต๊ะ");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "เชื่อมต่อไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  if (closed) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-50 p-6">
        <div className="max-w-sm rounded-3xl bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto mb-4 text-emerald-600" size={48} />
          <h1 className="text-2xl font-semibold">ขอบคุณที่มาใช้บริการ</h1>
          <p className="mt-3 text-slate-500">หวังว่าจะได้ต้อนรับคุณอีกครั้ง</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="grid min-h-dvh place-items-center bg-slate-50 p-6">
        <p role="status">{message || "กำลังเปิดเมนูของโต๊ะ…"}</p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[#f6f7fb] pb-32 text-slate-800">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-4">
          <div className="min-w-0">
            {data.brand.logoUrl && (
              <img
                src={data.brand.logoUrl}
                alt={`โลโก้ ${data.restaurantName}`}
                className="mb-2 h-14 w-14 object-contain"
              />
            )}
            <p className="whitespace-pre-wrap text-xs text-slate-500">
              {data.brand.welcomeMessage || "ยินดีต้อนรับ · สั่งอาหารร่วมโต๊ะ"}
            </p>
            <h1 className="break-words text-xl font-semibold">
              {data.restaurantName}
            </h1>
          </div>
          <span className="rounded-2xl bg-blue-50 px-4 py-2 font-semibold text-blue-700">
            {data.tableName}
          </span>
        </div>
        <nav className="mx-auto flex max-w-3xl gap-4 px-4">
          {(
            [
              ["menu", "เมนูอาหาร"],
              ["mine", "รายการที่ฉันสั่ง"],
              ["table", "รายการทั้งโต๊ะ"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`border-b-2 py-3 text-sm ${
                tab === key
                  ? "border-blue-600 font-semibold text-blue-600"
                  : "border-transparent text-slate-500"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      <div className="mx-auto max-w-3xl space-y-4 p-4">
        {message && (
          <div
            role="status"
            className="flex justify-between gap-3 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800"
          >
            {message}
            <button aria-label="ปิดข้อความ" onClick={() => setMessage("")}>
              <X size={18} />
            </button>
          </div>
        )}
        {blocked && (
          <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
            {data.billRequestedAt
              ? "เรียกเก็บเงินแล้ว พักรับรายการเพิ่มระหว่างรอชำระเงิน"
              : "ร้านพักรับรายการของโต๊ะนี้ชั่วคราว กรุณาติดต่อพนักงาน"}
          </p>
        )}

        {tab === "menu" ? (
          <GuestMenuCatalog
            menu={data.menu}
            category={category}
            search={search}
            blocked={blocked}
            onCategory={setCategory}
            onSearch={setSearch}
            onSelect={(menu) => {
              setMessage("");
              setEditing({
                key: createGuestId(),
                menu,
                qty: 1,
                note: "",
                modifierIds: [],
              });
            }}
          />
        ) : (
          <GuestSubmittedOrders
            order={data.order}
            tab={tab}
            billRequested={Boolean(data.billRequestedAt)}
            busy={busy}
            onRequestBill={requestBill}
          />
        )}
      </div>

      {!!cart.length && !showCart && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-gradient-to-t from-[#f6f7fb] to-transparent p-4">
          <button
            onClick={() => setShowCart(true)}
            className="mx-auto flex w-full max-w-3xl justify-between rounded-2xl bg-blue-600 p-4 text-white shadow-lg"
          >
            <span className="flex gap-2">
              <ShoppingBag size={20} />
              ดูตะกร้า · {cart.reduce((sum, line) => sum + line.qty, 0)} รายการ
            </span>
            <b>{guestMoney(total)}</b>
          </button>
        </div>
      )}

      {(editing || showCart) && (
        <GuestCartDialog
          editing={editing}
          cart={cart}
          message={message}
          total={total}
          busy={busy}
          blocked={blocked}
          onEditingChange={setEditing}
          onSelectOption={selectOption}
          onSaveLine={saveLine}
          onRemove={(lineKey) =>
            setCart((lines) => lines.filter((line) => line.key !== lineKey))
          }
          onClose={() => {
            setEditing(null);
            setShowCart(false);
          }}
          onSubmit={submit}
        />
      )}
    </main>
  );
}
