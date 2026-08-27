import { NextRequest, NextResponse } from "next/server";
import { StaffRole } from "@prisma/client";
import { authorizeApi, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createStripeAccountLink, createStripeConnectedAccount, isStripePromptPayGatewayEnabled, syncStripeConnectStatus } from "@/lib/stripe";

function originFromRequest(req: NextRequest) {
  return req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
}

function serialize(settings: Awaited<ReturnType<typeof syncStripeConnectStatus>>) {
  return {
    stripeGatewayReady: isStripePromptPayGatewayEnabled(),
    stripeConnected: Boolean(settings?.stripeAccountId),
    stripeReady: Boolean(settings?.stripeAccountId && settings.stripeChargesEnabled),
    stripeAccountId: settings?.stripeAccountId || "",
    stripeChargesEnabled: Boolean(settings?.stripeChargesEnabled),
    stripePayoutsEnabled: Boolean(settings?.stripePayoutsEnabled),
    stripeDetailsSubmitted: Boolean(settings?.stripeDetailsSubmitted),
  };
}

export async function GET() {
  const auth = await authorizeApi([StaffRole.OWNER]);
  if ("response" in auth) return auth.response;

  try {
    const settings = await syncStripeConnectStatus(auth.user.restaurantId);
    return NextResponse.json(serialize(settings));
  } catch (error) {
    const message = error instanceof Error ? error.message : "ตรวจสอบสถานะ Stripe ไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authorizeApi([StaffRole.OWNER]);
  if ("response" in auth) return auth.response;

  try {
    const restaurant = await prisma.restaurant.findUniqueOrThrow({
      where: { id: auth.user.restaurantId },
      include: { paymentSettings: true },
    });

    let accountId = restaurant.paymentSettings?.stripeAccountId || "";
    if (!accountId) {
      const account = await createStripeConnectedAccount({ businessName: restaurant.name });
      accountId = account.id;
      await prisma.paymentSettings.upsert({
        where: { restaurantId: restaurant.id },
        create: {
          restaurantId: restaurant.id,
          stripeAccountId: account.id,
          stripeChargesEnabled: Boolean(account.charges_enabled),
          stripePayoutsEnabled: Boolean(account.payouts_enabled),
          stripeDetailsSubmitted: Boolean(account.details_submitted),
        },
        update: {
          stripeAccountId: account.id,
          stripeChargesEnabled: Boolean(account.charges_enabled),
          stripePayoutsEnabled: Boolean(account.payouts_enabled),
          stripeDetailsSubmitted: Boolean(account.details_submitted),
        },
      });
      await writeAudit(auth.user.id, "CONNECT_STRIPE_ACCOUNT", "PaymentSettings", restaurant.id, { stripeAccountId: account.id });
    }

    const link = await createStripeAccountLink({ accountId, origin: originFromRequest(req) });
    return NextResponse.json({ url: link.url, stripeAccountId: accountId });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const message = code === "STRIPE_SECRET_KEY_MISSING"
      ? "ยังไม่ได้ตั้งค่า STRIPE_SECRET_KEY บน server"
      : error instanceof Error
        ? error.message
        : "สร้างลิงก์เชื่อมต่อ Stripe ไม่สำเร็จ";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
