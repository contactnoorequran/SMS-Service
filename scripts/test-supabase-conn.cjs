const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');

async function testPg(url) {
  console.log('Testing PG Client with URL:', url.replace(/:[^:@]+@/, ':***@'));
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const res = await client.query('SELECT 1 as val');
    console.log('PG Client SUCCESS:', res.rows);
    await client.end();
  } catch (err) {
    console.error('PG Client ERROR:', err.message);
  }
}

async function testPrisma(url) {
  console.log('Testing Prisma with URL:', url.replace(/:[^:@]+@/, ':***@'));
  const p = new PrismaClient({ datasources: { db: { url } } });
  try {
    const res = await p.$queryRaw`SELECT 1 as val`;
    console.log('Prisma SUCCESS:', res);
    await p.$disconnect();
  } catch (err) {
    console.error('Prisma ERROR:', err.message);
  }
}

async function main() {
  const base = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/\/[^/]+$/, '') : "postgresql://postgres:postgres@aws-0-ap-northeast-2.pooler.supabase.com";
  
  console.log('\n--- 1. Port 5432 with pgbouncer=true&connection_limit=1 ---');
  await testPg(`${base}:5432/postgres?sslmode=require`);
  await testPrisma(`${base}:5432/postgres?pgbouncer=true&connection_limit=1`);

  console.log('\n--- 2. Port 6543 with pgbouncer=true&connection_limit=1 ---');
  await testPg(`${base}:6543/postgres?sslmode=require`);
  await testPrisma(`${base}:6543/postgres?pgbouncer=true&connection_limit=1`);
}

main();
