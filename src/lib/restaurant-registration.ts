/**
 * สร้างชื่อย่อใน URL จากชื่อร้านอาหาร
 * ใช้ตรวจชื่อซ้ำและเติมหมายเลขต่อท้ายจนได้ URL ที่ไม่ชนกับร้านอื่น
 */

import "server-only";

import { prisma } from "@/lib/prisma";

function slugify(value: string) {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || `restaurant-${Date.now().toString().slice(-6)}`;
}

export async function uniqueRestaurantSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let suffix = 2;
  while (await prisma.restaurant.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
  return slug;
}
