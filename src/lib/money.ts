import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export function money(value: unknown): Prisma.Decimal {
  if (!(typeof value === "string" || typeof value === "number" || value instanceof Prisma.Decimal)) throw new Error("INVALID_AMOUNT");
  let amount: Prisma.Decimal;
  try { amount = new Prisma.Decimal(value); } catch { throw new Error("INVALID_AMOUNT"); }
  if (!amount.isFinite() || amount.isNegative() || amount.decimalPlaces() > 2 || amount.greaterThan("999999999999.99")) throw new Error("INVALID_AMOUNT");
  return amount;
}
export function cents(value: unknown) { return money(value).times(100).toNumber(); }

// Preserve the existing numeric API contract; calculations/storage use Decimal.
export function publicNumbers(value: unknown): any {
  if (value instanceof Prisma.Decimal) return value.toNumber();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(publicNumbers);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, publicNumbers(item)]));
  return value;
}
export function moneyJson(value: unknown, init?: ResponseInit) { return NextResponse.json(publicNumbers(value), init); }
