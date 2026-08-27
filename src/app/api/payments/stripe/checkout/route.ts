import { StaffRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { createPromptPayCheckoutSession } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const auth = await authorizeApi([StaffRole.OWNER, StaffRole.CASHIER]);
  if ("response" in auth) return auth.response;

  try {
    const { orderId } = await req.json() as { orderId?: number };
    if (!orderId) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 400 });

    const origin = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
    const session = await createPromptPayCheckoutSession({ orderId: Number(orderId), origin, restaurantId: auth.user.restaurantId });
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const message = code === "STRIPE_SECRET_KEY_MISSING"
      ? "ยังไม่ได้ตั้งค่า STRIPE_SECRET_KEY"
      : code === "ALREADY_PAID"
        ? "ออเดอร์นี้ชำระเงินแล้ว"
        : code === "ORDER_NOT_FOUND"
          ? "ไม่พบออเดอร์"
          : error instanceof Error
            ? error.message
            : "สร้างรายการชำระเงิน Stripe ไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
