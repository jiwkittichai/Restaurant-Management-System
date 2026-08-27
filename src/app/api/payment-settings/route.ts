import { NextRequest, NextResponse } from "next/server";
import { StaffRole } from "@prisma/client";
import { authorizeApi, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStripePromptPayGatewayEnabled } from "@/lib/stripe";

const defaultSettings = {
  promptPayEnabled: false,
  promptPayMode: "MANUAL_QR",
  promptPayAccountName: "",
  promptPayIdentifier: "",
  promptPayQrImageUrl: "",
  stripeEnabled: false,
};

function serialize(settings: typeof defaultSettings) {
  return {
    ...settings,
    stripeGatewayReady: isStripePromptPayGatewayEnabled(),
  };
}

export async function GET() {
  const auth = await authorizeApi([StaffRole.OWNER, StaffRole.CASHIER]);
  if ("response" in auth) return auth.response;

  const settings = await prisma.paymentSettings.findUnique({
    where: { restaurantId: auth.user.restaurantId },
  });

  return NextResponse.json(serialize(settings ? {
    promptPayEnabled: settings.promptPayEnabled,
    promptPayMode: settings.promptPayMode,
    promptPayAccountName: settings.promptPayAccountName || "",
    promptPayIdentifier: settings.promptPayIdentifier || "",
    promptPayQrImageUrl: settings.promptPayQrImageUrl || "",
    stripeEnabled: settings.stripeEnabled,
  } : defaultSettings));
}

export async function PATCH(req: NextRequest) {
  const auth = await authorizeApi([StaffRole.OWNER]);
  if ("response" in auth) return auth.response;

  const body = await req.json();
  const promptPayMode = body.promptPayMode === "STRIPE" ? "STRIPE" : "MANUAL_QR";
  const data = {
    promptPayEnabled: Boolean(body.promptPayEnabled),
    promptPayMode,
    promptPayAccountName: String(body.promptPayAccountName || "").trim() || null,
    promptPayIdentifier: String(body.promptPayIdentifier || "").trim() || null,
    promptPayQrImageUrl: String(body.promptPayQrImageUrl || "").trim() || null,
    stripeEnabled: Boolean(body.stripeEnabled),
  };

  if (data.promptPayEnabled && promptPayMode === "MANUAL_QR" && !data.promptPayQrImageUrl) {
    return NextResponse.json({ error: "กรุณาอัปโหลดรูป QR พร้อมเพย์" }, { status: 400 });
  }

  const settings = await prisma.paymentSettings.upsert({
    where: { restaurantId: auth.user.restaurantId },
    create: { restaurantId: auth.user.restaurantId, ...data },
    update: data,
  });

  await writeAudit(auth.user.id, "UPDATE_PAYMENT_SETTINGS", "PaymentSettings", settings.id, {
    promptPayEnabled: settings.promptPayEnabled,
    promptPayMode: settings.promptPayMode,
    stripeEnabled: settings.stripeEnabled,
  });

  return NextResponse.json(serialize({
    promptPayEnabled: settings.promptPayEnabled,
    promptPayMode: settings.promptPayMode,
    promptPayAccountName: settings.promptPayAccountName || "",
    promptPayIdentifier: settings.promptPayIdentifier || "",
    promptPayQrImageUrl: settings.promptPayQrImageUrl || "",
    stripeEnabled: settings.stripeEnabled,
  }));
}
