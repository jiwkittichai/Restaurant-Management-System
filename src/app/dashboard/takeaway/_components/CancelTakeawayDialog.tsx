import type { TakeawayOrder } from "../types";

export default function CancelTakeawayDialog({ order, loading, onClose, onConfirm }: { order: TakeawayOrder; loading: boolean; onClose: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><h2 className="font-semibold text-gray-900">ยกเลิกคิวซื้อกลับบ้าน</h2><p className="mt-2 text-sm text-gray-500">ต้องการยกเลิกคิว {order.queueNumber} ({order.orderNumber}) หรือไม่? วัตถุดิบของออเดอร์นี้จะถูกคืนเข้าสต็อก</p><div className="mt-5 flex gap-2"><button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-600">ยกเลิก</button><button onClick={onConfirm} disabled={loading} className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-white disabled:opacity-50">{loading ? "กำลังยกเลิก..." : "ยกเลิกคิว"}</button></div></div></div>;
}
