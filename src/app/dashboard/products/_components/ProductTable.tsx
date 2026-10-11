import { Pencil, Trash2 } from "lucide-react";
import type { ProductListItem } from "../types";

export default function ProductTable({
  products,
  onEdit,
  onDelete,
  onToggle,
}: {
  products: ProductListItem[];
  onEdit: (product: ProductListItem) => void;
  onDelete: (product: ProductListItem) => void;
  onToggle: (product: ProductListItem) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th className="p-4 text-left">เมนู</th>
            <th className="p-4 text-left">หมวดหมู่</th>
            <th className="p-4 text-right">ราคา</th>
            <th className="p-4 text-center">พร้อมขาย</th>
            <th className="p-4 text-center">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-t border-gray-100">
              <td className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-xl bg-gray-100">
                    {product.image && (
                      <img
                        src={product.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.sku}</p>
                  </div>
                </div>
              </td>
              <td className="p-4 text-gray-500">{product.category.name}</td>
              <td className="p-4 text-right font-medium">
                ฿{product.price.toFixed(2)}
              </td>
              <td className="p-4 text-center">
                <button
                  onClick={() => onToggle(product)}
                  className={`rounded-full px-3 py-1 text-xs ${product.available ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {product.available ? "พร้อมขาย" : "ปิดขาย"}
                </button>
                <p
                  className={`mt-1 text-[11px] ${product.maxServings === 0 ? "text-red-500" : "text-gray-400"}`}
                >
                  {!product.stockTracked
                    ? "ยังไม่มีสูตร"
                    : product.maxServings === 0
                      ? "วัตถุดิบหมด"
                      : `ขายได้ ${product.maxServings} ${product.saleUnit || "จาน"}`}
                </p>
              </td>
              <td className="p-4">
                <div className="flex justify-center gap-2">
                  <button
                    aria-label={`แก้ไข ${product.name}`}
                    onClick={() => onEdit(product)}
                    className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    aria-label={`ลบ ${product.name}`}
                    onClick={() => onDelete(product)}
                    className="rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!products.length && (
        <p className="py-10 text-center text-gray-400">ยังไม่มีเมนูอาหาร</p>
      )}
    </div>
  );
}
