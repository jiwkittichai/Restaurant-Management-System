import { StaffRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { authorizeApi } from "@/lib/auth";
import { completeStripePromptPayPaymentIntent, createPromptPayPaymentIntent } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const auth = await authorizeApi([StaffRole.OWNER, StaffRole.CASHIER]);
  if ("response" in auth) return auth.response;

  try {
    const { orderId } = await req.json() as { orderId?: number };
    if (!orderId) return NextResponse.json({ error: "ไม่พบออเดอร์" }, { status: 400 });

    const payment = await createPromptPayPaymentIntent({ orderId: Number(orderId) });
    return NextResponse.json(payment);
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const message = code === "STRIPE_SECRET_KEY_MISSING"
      ? "ยังไม่ได้ตั้งค่า STRIPE_SECRET_KEY"
      : code === "ALREADY_PAID"
        ? "ออเดอร์นี้ชำระเงินแล้ว"
        : code === "ORDER_NOT_FOUND"
          ? "ไม่พบออเดอร์"
          : code === "PROMPTPAY_QR_NOT_READY"
            ? "Stripe ยังไม่ได้ส่ง QR PromptPay กลับมา"
            : error instanceof Error
              ? error.message
              : "สร้าง QR PromptPay ไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authorizeApi([StaffRole.OWNER, StaffRole.CASHIER]);
  if ("response" in auth) return auth.response;

  try {
    const { paymentIntentId } = await req.json() as { paymentIntentId?: string };
    if (!paymentIntentId) return NextResponse.json({ error: "ไม่พบรายการชำระเงิน" }, { status: 400 });

    const result = await completeStripePromptPayPaymentIntent({ paymentIntentId, employeeId: auth.user.id });
    return NextResponse.json({
      paid: result.paid,
      status: result.paymentIntent.status,
      order: result.order,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ตรวจสอบการชำระเงินไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
