import { NextRequest, NextResponse } from "next/server";
import { completeStripePromptPayOrder, completeStripePromptPayPaymentIntent, parseStripeEvent, verifyStripeWebhookSignature } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  try {
    if (!verifyStripeWebhookSignature(rawBody, req.headers.get("stripe-signature"))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = parseStripeEvent(rawBody);
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      if (event.data.object.object === "checkout.session") {
        await completeStripePromptPayOrder({ sessionId: event.data.object.id });
      }
    }
    if (event.type === "payment_intent.succeeded") {
      if (event.data.object.object === "payment_intent") {
        await completeStripePromptPayPaymentIntent({ paymentIntentId: event.data.object.id, stripeAccountId: event.account });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stripe webhook failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
