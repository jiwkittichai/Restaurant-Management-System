import { PrismaClient } from '@prisma/client';
import { config as loadEnv } from 'dotenv';
import { randomBytes, scryptSync } from 'node:crypto';
import { pathToFileURL } from 'node:url';

class SetupError extends Error {}

export function validateConfig(env) {
  const username = (env.PLATFORM_ADMIN_USERNAME || '').trim().toLowerCase();
  const displayName = (env.PLATFORM_ADMIN_DISPLAY_NAME || '').trim();
  const password = env.PLATFORM_ADMIN_PASSWORD || '';
  if (!/^[a-z0-9._-]{3,30}$/.test(username)) {
    throw new SetupError('PLATFORM_ADMIN_USERNAME must contain 3–30 letters, numbers, dots, underscores or hyphens.');
  }
  if (!displayName || displayName.length > 100) {
    throw new SetupError('Set PLATFORM_ADMIN_DISPLAY_NAME (1–100 characters).');
  }
  if (password.length < 12 || password.length > 128 || !password.trim()) {
    throw new SetupError('Set PLATFORM_ADMIN_PASSWORD to a private password of 12–128 characters.');
  }
  if (password === 'เปลี่ยนเป็นรหัสผ่านแอดมินอย่างน้อย-12-ตัว') {
    throw new SetupError('Replace the example PLATFORM_ADMIN_PASSWORD with a private password.');
  }
  if (username === (env.SEED_OWNER_USERNAME || '').trim().toLowerCase()) {
    throw new SetupError('Platform admin and seed owner must have different usernames.');
  }
  if (password === env.SEED_OWNER_PASSWORD) {
    throw new SetupError('Platform admin and seed owner must have different passwords.');
  }
  return { username, displayName, password };
}

export async function initializePlatform(db, env) {
  const config = validateConfig(env);
  return db.$transaction(async (tx) => {
    const employee = await tx.employee.findUnique({
      where: { username: config.username }, select: { id: true },
    });
    if (employee) throw new SetupError('This username belongs to a shop account. Choose a different admin username. No data changed.');

    const settings = await tx.platformSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
      await tx.platformSettings.create({ data: { id: 1, name: 'Restaurant Management System' } });
    }

    const existing = await tx.platformAdmin.findUnique({
      where: { username: config.username }, select: { id: true, active: true },
    });
    if (existing) {
      return { admin: 'unchanged', active: existing.active, settings: settings ? 'unchanged' : 'created' };
    }

    // Same scrypt format as src/lib/password.ts; no plaintext password is stored.
    const salt = randomBytes(16).toString('hex');
    const passwordHash = `scrypt$${salt}$${scryptSync(config.password, salt, 64).toString('hex')}`;
    const admin = await tx.platformAdmin.create({
      data: { username: config.username, displayName: config.displayName, passwordHash },
    });
    await tx.platformLog.create({
      data: { adminId: admin.id, actorName: 'Admin', action: 'PLATFORM_ADMIN_CREATED' },
    });
    return { admin: 'created', active: true, settings: settings ? 'unchanged' : 'created' };
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  loadEnv({ quiet: true });
  let db;
  try {
    if (process.argv.length > 2) throw new SetupError('This command accepts no flags and never resets existing accounts.');
    if (!process.env.DATABASE_URL) throw new SetupError('Set DATABASE_URL and run prisma migrate deploy first.');
    validateConfig(process.env);
    db = new PrismaClient();
    const result = await initializePlatform(db, process.env);
    console.log(result.admin === 'created'
      ? 'Platform admin created. Sign in at /login using your configured credentials.'
      : 'Platform admin already exists. Password, display name, active status and sessions were NOT changed.');
    if (!result.active) console.log('The existing admin is disabled. This command does not reactivate accounts.');
    console.log(`Platform settings: ${result.settings}. No shop data was seeded or deleted.`);
  } catch (error) {
    // Prisma errors can contain query arguments; never print raw errors or credentials.
    console.error(error instanceof SetupError ? error.message
      : error?.code === 'P2002' ? 'A setup record already exists. No changes committed; check the accounts and rerun.'
      : 'Platform initialization failed. Check database connectivity and migrations. No changes committed.');
    process.exitCode = 1;
  } finally {
    if (db) await db.$disconnect();
  }
}
