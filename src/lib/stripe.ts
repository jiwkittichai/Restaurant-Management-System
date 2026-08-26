import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { OrderStatus, OrderType, PaymentMethod, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/auth";

type StripeCheckoutSession = {
  id: string;
  object: "checkout.session";
  client_reference_id?: string | null;
  payment_status?: string;
  payment_intent?: string | null;
  metadata?: Record<string, string>;
  url?: string | null;
};

type StripePromptPayQr = {
  data?: string;
  hosted_instructions_url?: string;
  image_url_png?: string;
  image_url_svg?: string;
};

type StripePaymentIntent = {
  id: string;
  object: "payment_intent";
  amount: number;
  currency: string;
  status: string;
  metadata?: Record<string, string>;
  next_action?: {
    type?: string;
    promptpay_display_qr_code?: StripePromptPayQr;
  } | null;
};

type StripeEvent = {
  id: string;
  type: string;
  data: { object: StripeCheckoutSession | StripePaymentIntent };
};

function stripeSecretKey() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY_MISSING");
  return key;
}

export function isStripePromptPayGatewayEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

async function stripeRequest<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${stripeSecretKey()}`,
      ...(init.body instanceof URLSearchParams ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...init.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || "Stripe request failed";
    throw new Error(message);
  }
  return data as T;
}

export async function createPromptPayCheckoutSession(args: {
  orderId: number;
  origin: string;
}) {
  const order = await prisma.order.findUnique({
    where: { id: args.orderId },
    include: { table: true, payment: true },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.payment || order.paymentStatus === PaymentStatus.PAID) throw new Error("ALREADY_PAID");
  if (order.total <= 0) throw new Error("INVALID_AMOUNT");

  const amount = Math.round(order.total * 100);
  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("locale", "th");
  params.append("payment_method_types[0]", "promptpay");
  params.append("client_reference_id", String(order.id));
  params.append("metadata[orderId]", String(order.id));
  params.append("metadata[orderNumber]", order.orderNumber);
  params.append("line_items[0][price_data][currency]", "thb");
  params.append("line_items[0][price_data][product_data][name]", `บิล ${order.orderNumber}`);
  params.append("line_items[0][price_data][unit_amount]", String(amount));
  params.append("line_items[0][quantity]", "1");
  params.append("payment_intent_data[metadata][orderId]", String(order.id));
  params.append("payment_intent_data[metadata][orderNumber]", order.orderNumber);
  params.append("success_url", `${args.origin}/dashboard/payments/stripe/success?session_id={CHECKOUT_SESSION_ID}`);
  params.append("cancel_url", `${args.origin}${order.type === OrderType.TAKEAWAY ? "/dashboard/takeaway" : "/dashboard/tables"}`);

  return stripeRequest<StripeCheckoutSession>("/checkout/sessions", { method: "POST", body: params });
}

export async function retrieveCheckoutSession(sessionId: string) {
  return stripeRequest<StripeCheckoutSession>(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
}

export async function createPromptPayPaymentIntent(args: { orderId: number }) {
  const order = await prisma.order.findUnique({
    where: { id: args.orderId },
    include: { payment: true },
  });
  if (!order) throw new Error("ORDER_NOT_FOUND");
  if (order.payment || order.paymentStatus === PaymentStatus.PAID) throw new Error("ALREADY_PAID");
  if (order.total <= 0) throw new Error("INVALID_AMOUNT");

  const params = new URLSearchParams();
  params.append("amount", String(Math.round(order.total * 100)));
  params.append("currency", "thb");
  params.append("payment_method_types[0]", "promptpay");
  params.append("payment_method_data[type]", "promptpay");
  params.append("payment_method_data[billing_details][email]", process.env.STRIPE_PROMPTPAY_BILLING_EMAIL || "customer@example.com");
  params.append("payment_method_data[billing_details][name]", order.customerName || `Customer ${order.orderNumber}`);
  params.append("confirm", "true");
  params.append("metadata[orderId]", String(order.id));
  params.append("metadata[orderNumber]", order.orderNumber);
  params.append("description", `บิล ${order.orderNumber}`);

  const paymentIntent = await stripeRequest<StripePaymentIntent>("/payment_intents", { method: "POST", body: params });
  const qr = paymentIntent.next_action?.promptpay_display_qr_code;
  if (!qr?.image_url_png && !qr?.image_url_svg) throw new Error("PROMPTPAY_QR_NOT_READY");

  return {
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    qrCodeImageUrl: qr.image_url_png || qr.image_url_svg,
    hostedInstructionsUrl: qr.hosted_instructions_url,
  };
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  return stripeRequest<StripePaymentIntent>(`/payment_intents/${encodeURIComponent(paymentIntentId)}`);
}

async function markPromptPayOrderPaid(args: {
  orderId: number;
  employeeId?: number | null;
  providerDetails: Prisma.InputJsonObject;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.order.findUniqueOrThrow({
      where: { id: args.orderId },
      include: { payment: true },
    });
    if (current.payment) return { order: current, payment: current.payment, alreadyPaid: true };

    const payment = await tx.payment.create({
      data: {
        orderId: current.id,
        method: PaymentMethod.PROMPTPAY,
        amount: current.total,
        receivedAmount: current.total,
        changeAmount: 0,
      },
    });
    const order = await tx.order.update({
      where: { id: current.id },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: current.type === OrderType.DINE_IN ? OrderStatus.SERVED : current.status,
      },
    });
    if (current.tableId) {
      await tx.restaurantTable.update({ where: { id: current.tableId }, data: { status: "AVAILABLE" } });
    }
    return { order, payment, alreadyPaid: false };
  });

  if (!result.alreadyPaid) {
    await writeAudit(args.employeeId ?? null, "PAY_ORDER", "Order", result.order.id, {
      orderNumber: result.order.orderNumber,
      method: PaymentMethod.PROMPTPAY,
      provider: "stripe",
      total: result.order.total,
      ...args.providerDetails,
    } as Prisma.InputJsonObject);
  }

  return result;
}

export async function completeStripePromptPayPaymentIntent(args: {
  paymentIntentId: string;
  employeeId?: number | null;
}) {
  const paymentIntent = await retrievePaymentIntent(args.paymentIntentId);
  if (paymentIntent.status !== "succeeded") return { paid: false, order: null, paymentIntent };

  const orderId = Number(paymentIntent.metadata?.orderId);
  if (!Number.isInteger(orderId)) throw new Error("ORDER_NOT_FOUND");

  const result = await markPromptPayOrderPaid({
    orderId,
    employeeId: args.employeeId,
    providerDetails: {
      stripePaymentIntentId: paymentIntent.id,
      stripePaymentIntentStatus: paymentIntent.status,
    },
  });

  return { paid: true, order: result.order, paymentIntent };
}

export async function completeStripePromptPayOrder(args: {
  sessionId: string;
  employeeId?: number | null;
}) {
  const session = await retrieveCheckoutSession(args.sessionId);
  if (session.payment_status !== "paid") return { paid: false, order: null, session };

  const orderId = Number(session.client_reference_id || session.metadata?.orderId);
  if (!Number.isInteger(orderId)) throw new Error("ORDER_NOT_FOUND");

  const result = await markPromptPayOrderPaid({
    orderId,
    employeeId: args.employeeId,
    providerDetails: {
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: session.payment_intent || null,
    },
  });

  return { paid: true, order: result.order, session };
}

export function verifyStripeWebhookSignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET_MISSING");
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(signatureHeader.split(",").map((part) => {
    const [key, value] = part.split("=");
    return [key, value];
  }));
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");
  return expectedBuffer.length === signatureBuffer.length && timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function parseStripeEvent(rawBody: string) {
  return JSON.parse(rawBody) as StripeEvent;
}
