import { getPrismaClient } from '../server/db/prisma';

async function run() {
  const prisma = getPrismaClient();
  if (!prisma) {
    console.error('Prisma client could not be created');
    process.exit(1);
  }

  const result: any = {};

  try {
    // 1. _prisma_migrations
    try {
      result.migrations = await prisma.$queryRawUnsafe(`
        SELECT id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
        FROM _prisma_migrations
        ORDER BY started_at ASC
      `);
    } catch (e: any) {
      result.migrationsError = e.message;
    }

    // 2. information_schema.tables
    result.tables = await prisma.$queryRawUnsafe(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name ASC
    `);

    // 3. Types / Enums
    result.types = await prisma.$queryRawUnsafe(`
      SELECT t.typname as enum_name, array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname
    `);

    // 4. Check for alternative architecture tables
    const tableNames = (result.tables as any[]).map((t) => t.table_name);
    result.hasAlternativeTables = [
      'NumberRange', 'PhoneNumber', 'CallDetailRecord', 'RateSheet', 'RateSheetItem', 'Session',
      'number_ranges', 'phone_numbers', 'call_detail_records', 'rate_sheets', 'rate_sheet_items', 'sessions'
    ].filter(name => tableNames.includes(name));

    console.log(JSON.stringify(result, null, 2));
  } catch (err: any) {
    console.error('Fatal audit error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
