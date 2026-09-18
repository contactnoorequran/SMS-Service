const { Client } = require('pg');
require('dotenv').config();

async function auditLiveDatabase() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('ERROR: DATABASE_URL is not set in environment.');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✓ Successfully connected to PostgreSQL/Supabase database.\n');

    // 1. Get current database name, user, version
    const metaRes = await client.query('SELECT current_database(), current_user, version()');
    console.log('--- DATABASE METADATA ---');
    console.log('Database:', metaRes.rows[0].current_database);
    console.log('User:', metaRes.rows[0].current_user);
    console.log('Version:', metaRes.rows[0].version.split(',')[0]);

    // 2. Check schemas
    const schemasRes = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name
    `);
    console.log('\n--- SCHEMAS ---');
    schemasRes.rows.forEach(r => console.log(' - ' + r.schema_name));

    // 3. Check all tables in public schema
    const tablesRes = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log(`\n--- TABLES IN PUBLIC SCHEMA (${tablesRes.rows.length} total) ---`);
    for (const row of tablesRes.rows) {
      // Get row count for each table
      let count = 0;
      try {
        const countRes = await client.query(`SELECT COUNT(*) FROM "public"."${row.table_name}"`);
        count = countRes.rows[0].count;
      } catch (err) {
        count = 'ERR: ' + err.message;
      }
      console.log(` - ${row.table_name} (${row.table_type}) : ${count} rows`);
    }

    // 4. Check if _prisma_migrations exists
    const prismaMigrationsRes = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = '_prisma_migrations'
      ) as exists
    `);
    console.log('\n--- PRISMA MIGRATIONS TABLE ---');
    console.log('Exists:', prismaMigrationsRes.rows[0].exists);
    if (prismaMigrationsRes.rows[0].exists) {
      const migRows = await client.query('SELECT * FROM "_prisma_migrations" ORDER BY started_at');
      console.log('Recorded migrations:', migRows.rows);
    }

    // 5. Check ENUM types
    const enumsRes = await client.query(`
      SELECT t.typname as enum_name, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname
    `);
    console.log(`\n--- CUSTOM ENUMS (${enumsRes.rows.length} total) ---`);
    enumsRes.rows.forEach(r => console.log(` - ${r.enum_name}: [${r.enum_values}]`));

    // 6. Check detailed columns for key tables
    console.log('\n--- COLUMN DETAILS FOR ALL PUBLIC TABLES ---');
    for (const table of tablesRes.rows) {
      const colRes = await client.query(`
        SELECT column_name, data_type, udt_name, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [table.table_name]);
      console.log(`\nTable: "${table.table_name}" (${colRes.rows.length} columns)`);
      colRes.rows.forEach(c => {
        const def = c.column_default ? ` DEFAULT ${c.column_default}` : '';
        const nullability = c.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(`   ${c.column_name}: ${c.data_type} (${c.udt_name}) ${nullability}${def}`);
      });
    }

    // 7. Check Foreign Keys
    console.log('\n--- FOREIGN KEY CONSTRAINTS ---');
    const fkRes = await client.query(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `);
    console.log(`Total Foreign Keys: ${fkRes.rows.length}`);
    fkRes.rows.forEach(r => {
      console.log(` - ${r.table_name}.${r.column_name} -> ${r.foreign_table_name}.${r.foreign_column_name} (ON UPDATE ${r.update_rule}, ON DELETE ${r.delete_rule})`);
    });

  } catch (err) {
    console.error('Audit failed with error:', err);
  } finally {
    await client.end();
  }
}

auditLiveDatabase();
