import type { ActiveOrder } from "../types";

export default function CancelOrderDialog({ order, onClose, onConfirm }: { order: ActiveOrder; onClose: () => void; onConfirm: () => void }) {
  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><h2 className="font-semibold text-gray-900">ยกเลิกออเดอร์</h2><p className="mt-2 text-sm text-gray-500">ต้องการยกเลิก {order.orderNumber} หรือไม่? วัตถุดิบของออเดอร์นี้จะถูกคืนเข้าสต็อก</p><div className="mt-5 flex gap-2"><button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-gray-600">ยกเลิก</button><button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 px-4 py-3 text-white">ยกเลิกออเดอร์</button></div></div></div>;
}
