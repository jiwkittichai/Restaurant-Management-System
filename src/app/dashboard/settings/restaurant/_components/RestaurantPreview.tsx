import type { RestaurantBrand } from "@/lib/restaurant-brand";

export default function RestaurantPreview({
  restaurant,
}: {
  restaurant: RestaurantBrand;
}) {
  return (
    <aside>
      <p className="mb-3 text-sm text-slate-500">ตัวอย่างหน้าลูกค้า</p>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          {restaurant.logoUrl && (
            <img
              src={restaurant.logoUrl}
              alt="ตัวอย่างโลโก้"
              className="mb-3 h-16 w-16 object-contain"
            />
          )}
          <p className="whitespace-pre-wrap text-xs text-slate-500">
            {restaurant.welcomeMessage || "ยินดีต้อนรับ · สั่งอาหารร่วมโต๊ะ"}
          </p>
          <h3 className="mt-1 break-words text-xl font-semibold">
            {restaurant.name || "ชื่อร้านของคุณ"}
          </h3>
        </div>
        <div className="bg-slate-50 p-5">
          <span className="text-sm text-blue-600">เมนูอาหาร · โต๊ะ 1</span>
          <div className="mt-4 grid h-24 place-items-center rounded-xl border border-dashed bg-white text-slate-400">
            เมนูของร้าน
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 text-center">
        <p className="font-semibold">ตัวอย่างหัวใบเสร็จ</p>
        <p className="mt-4 break-words font-semibold">
          {restaurant.name || "ชื่อร้านของคุณ"}
        </p>
        <p className="mt-2 whitespace-pre-wrap text-xs">{restaurant.address}</p>
        {restaurant.phone && (
          <p className="mt-1 text-xs">โทร. {restaurant.phone}</p>
        )}
        <p className="mt-4 whitespace-pre-wrap border-t pt-4 text-xs">
          {restaurant.receiptFooter || "ขอบคุณที่ใช้บริการ"}
        </p>
      </div>
    </aside>
  );
}
