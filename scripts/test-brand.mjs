import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Client } from 'minio';
import { randomBytes, createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const db = new PrismaClient();
const base = process.env.QR_TEST_BASE_URL || 'http://localhost:3000';
let restaurant, uploadedKey;
let cookie = '';
async function api(path, body, method = 'PATCH') {
  const response = await fetch(base + path, { method: body ? method : 'GET', headers: { cookie, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
  return { status: response.status, data: await response.json() };
}
try {
  restaurant = await db.restaurant.create({ data: { name: 'Brand test', slug: `brand-test-${randomBytes(8).toString('hex')}` } });
  const employee = await db.employee.create({ data: { restaurantId: restaurant.id, username: restaurant.slug, displayName: 'Brand test', passwordHash: 'unused', roles: { create: { role: 'OWNER' } } } });
  const authToken = randomBytes(32).toString('hex');
  await db.authSession.create({ data: { tokenHash: createHash('sha256').update(authToken).digest('hex'), employeeId: employee.id, expiresAt: new Date(Date.now() + 600000) } });
  assert.equal((await api('/api/restaurant-profile')).status, 401);
  cookie = `restaurant_session=${authToken}`;
  const brand = { name: 'ครัวบ้านสวน & เพื่อน', address: '123 ถนนตัวอย่าง\nกรุงเทพฯ', phone: '02-123-4567', welcomeMessage: 'อาหารสดใหม่ทุกจาน', receiptFooter: 'ขอบคุณที่อุดหนุน\nแล้วพบกันใหม่' };
  assert.equal((await api('/api/restaurant-profile', { ...brand, name: '' })).status, 400);
  assert.equal((await api('/api/restaurant-profile', { ...brand, logoUrl: 'http://127.0.0.1:9000/products/restaurants/999999/fake.png' })).status, 400);
  const form = new FormData();
  form.set('purpose', 'restaurant_logo');
  form.set('file', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'brand.png');
  const uploaded = await fetch(base + '/api/upload', { method: 'POST', headers: { cookie }, body: form });
  assert.equal(uploaded.status, 200);
  const { url } = await uploaded.json(); uploadedKey = decodeURIComponent(new URL(url).pathname.split('/').slice(2).join('/'));
  const saved = await api('/api/restaurant-profile', { ...brand, logoUrl: url });
  assert.equal(saved.status, 200, JSON.stringify(saved)); assert.equal(saved.data.name, brand.name);
  assert.match(saved.data.logoUrl, /^\/api\/restaurants\/\d+\/logo/);
  const image = await fetch(base + saved.data.logoUrl); assert.equal(image.status, 200); assert.equal(image.headers.get('content-type'), 'image/png');
  const table = await db.restaurantTable.create({ data: { restaurantId: restaurant.id, name: 'โต๊ะ 1' } });
  const qr = await api('/api/table-sessions', { tableId: table.id, action: 'open' }, 'POST');
  assert.equal(qr.data.brand.receiptFooter, brand.receiptFooter);
  const token = qr.data.url.split('/').at(-1);
  const guest = await api(`/api/guest/${token}`); assert.equal(guest.data.brand.name, brand.name); assert.equal(guest.data.brand.logoUrl, saved.data.logoUrl);
  const html = await (await fetch(base + '/order/' + token)).text(); assert.ok(html.includes('ครัวบ้านสวน &amp; เพื่อน'));
  await db.employeeRole.update({ where: { employeeId_role: { employeeId: employee.id, role: 'OWNER' } }, data: { role: 'CASHIER' } });
  assert.equal((await api('/api/restaurant-profile', brand)).status, 403);
  assert.equal((await api('/api/restaurant-profile')).status, 200);
  console.log('PASS: profile validation, owner permissions, logo upload/serving, tenant ownership, QR branding, guest branding and page title.');
} finally {
  if (uploadedKey) {
    const minio = new Client({ endPoint: process.env.MINIO_ENDPOINT || '127.0.0.1', port: Number(process.env.MINIO_PORT) || 9000, useSSL: false, accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin', secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin' });
    await minio.removeObject(process.env.MINIO_BUCKET || 'products', uploadedKey);
  }
  if (restaurant) await db.restaurant.delete({ where: { id: restaurant.id } });
  await db.$disconnect();
}
