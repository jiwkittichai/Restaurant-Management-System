import { NextRequest, NextResponse } from "next/server";
import { StaffRole } from "@prisma/client";
import { authorizeApi, writeAudit } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const defaultSettings = {
  promptPayEnabled: false,
  promptPayAccountName: "",
  promptPayIdentifier: "",
  promptPayQrImageUrl: "",
};

function serialize(settings: {
  promptPayEnabled: boolean;
  promptPayAccountName: string | null;
  promptPayIdentifier: string | null;
  promptPayQrImageUrl: string | null;
}) {
  return {
    promptPayEnabled: settings.promptPayEnabled,
    promptPayAccountName: settings.promptPayAccountName || "",
    promptPayIdentifier: settings.promptPayIdentifier || "",
    promptPayQrImageUrl: settings.promptPayQrImageUrl || "",
  };
}

export async function GET() {
  const auth = await authorizeApi([StaffRole.OWNER, StaffRole.CASHIER]);
  if ("response" in auth) return auth.response;

  const settings = await prisma.paymentSettings.findUnique({
    where: { restaurantId: auth.user.restaurantId },
  });

  return NextResponse.json(settings ? serialize(settings) : defaultSettings);
}

export async function PATCH(req: NextRequest) {
  const auth = await authorizeApi([StaffRole.OWNER]);
  if ("response" in auth) return auth.response;

  const body = await req.json();
  const data = {
    promptPayEnabled: Boolean(body.promptPayEnabled),
    promptPayAccountName: String(body.promptPayAccountName || "").trim() || null,
    promptPayIdentifier: String(body.promptPayIdentifier || "").trim() || null,
    promptPayQrImageUrl: String(body.promptPayQrImageUrl || "").trim() || null,
  };

  if (data.promptPayEnabled && !data.promptPayQrImageUrl) {
    return NextResponse.json({ error: "กรุณาอัปโหลดรูป QR พร้อมเพย์" }, { status: 400 });
  }

  const current = await prisma.paymentSettings.findUnique({
    where: { restaurantId: auth.user.restaurantId },
  });
  const settings = await prisma.paymentSettings.upsert({
    where: { restaurantId: auth.user.restaurantId },
    create: { restaurantId: auth.user.restaurantId, ...data },
    update: data,
  });

  await writeAudit(auth.user.id, "UPDATE_PAYMENT_SETTINGS", "PaymentSettings", settings.id, {
    qrChanged: (current?.promptPayQrImageUrl || null) !== settings.promptPayQrImageUrl,
    before: { promptPayEnabled: current?.promptPayEnabled ?? false },
    after: { promptPayEnabled: settings.promptPayEnabled },
  });

  return NextResponse.json(serialize(settings));
}
