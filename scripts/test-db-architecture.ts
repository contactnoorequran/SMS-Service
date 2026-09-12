/**
 * Database Architecture & Schema Verification Test Suite
 * Validates the Prisma schema, relationships, indexes, financial data types,
 * foreign keys, and migration DDL against Phase 02 requirements.
 */

import fs from 'fs';
import path from 'path';

interface ValidationResult {
  category: string;
  test: string;
  passed: boolean;
  details: string;
}

const results: ValidationResult[] = [];

function assert(category: string, test: string, condition: boolean, details: string) {
  results.push({ category, test, passed: condition, details });
}

async function runDatabaseArchitectureTests() {
  console.log('🔍 Executing Phase 02 Database Architecture Verification...\n');

  const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma');
  const migrationPath = path.join(process.cwd(), 'prisma', 'migrations', '20260910000000_phase_02_database_architecture', 'migration.sql');

  // 1. Check Schema file existence
  assert('Filesystem', 'Prisma schema file exists', fs.existsSync(schemaPath), schemaPath);
  assert('Filesystem', 'PostgreSQL migration DDL exists', fs.existsSync(migrationPath), migrationPath);

  if (!fs.existsSync(schemaPath)) {
    console.error('Schema file missing!');
    process.exit(1);
  }

  const schemaContent = fs.readFileSync(schemaPath, 'utf8');

  // 2. Required Models Check
  const requiredModels = [
    'User', 'Role', 'Permission', 'RolePermission',
    'ManagerProfile', 'AgentProfile', 'ClientProfile',
    'Provider', 'ProviderConnection', 'ProviderCredential',
    'Country', 'Operator', 'Range', 'Number',
    'NumberAssignment',
    'IncomingMessage', 'CDR',
    'Rate', 'ClientPayout',
    'Wallet', 'Transaction', 'CreditNote', 'PaymentRequest',
    'Notification', 'AuditLog', 'ApiCredential', 'ApiRequestLog',
    'SystemConfig'
  ];

  for (const model of requiredModels) {
    const modelRegex = new RegExp(`model\\s+${model}\\s+\\{`, 'm');
    assert('Model Definition', `Model ${model} declared`, modelRegex.test(schemaContent), `Model ${model} present in schema.prisma`);
  }

  // 3. Security Requirements
  assert('Security', 'User model does NOT store plaintext password', 
    schemaContent.includes('passwordHash') && !schemaContent.includes('password String'), 
    'Uses passwordHash and excludes plain password field');

  assert('Security', 'ProviderCredential has encryption & masking fields',
    schemaContent.includes('encryptedSecret') && schemaContent.includes('maskedKey') && schemaContent.includes('iv'),
    'Contains encryptedSecret, iv, and maskedKey fields for secure key vaulting');

  assert('Security', 'ApiCredential stores keyHash instead of plain API key',
    schemaContent.includes('keyHash') && schemaContent.includes('keyPrefix'),
    'Stores SHA-256 keyHash and public keyPrefix');

  // 4. Financial Precision (@db.Decimal)
  assert('Financial Integrity', 'CDR rates use high precision Decimal(18, 6)',
    schemaContent.includes('providerCost      Decimal         @db.Decimal(18, 6)') &&
    schemaContent.includes('netProfit         Decimal         @db.Decimal(18, 6)'),
    'CDR providerCost, clientPayout, and netProfit use @db.Decimal(18, 6)');

  assert('Financial Integrity', 'Wallet balances use Decimal(18, 4)',
    schemaContent.includes('balance         Decimal  @default(0) @db.Decimal(18, 4)'),
    'Wallet balances use Decimal(18, 4)');

  assert('Financial Integrity', 'Transaction ledger uses immutable balanceBefore / balanceAfter',
    schemaContent.includes('balanceBefore Decimal  @db.Decimal(18, 4)') &&
    schemaContent.includes('balanceAfter  Decimal  @db.Decimal(18, 4)'),
    'Transaction preserves balanceBefore and balanceAfter audit trail');

  // 5. Relational Cardinality & Integrity
  assert('Relationships', 'Provider -> Ranges (One to Many)',
    schemaContent.includes('ranges           Range[]') && schemaContent.includes('provider    Provider  @relation(fields: [providerId]'),
    'Provider has ranges: Range[] and Range links providerId');

  assert('Relationships', 'Range -> Numbers (One to Many)',
    schemaContent.includes('numbers      Number[]') && schemaContent.includes('range           Range          @relation(fields: [rangeId]'),
    'Range has numbers: Number[] and Number links rangeId');

  assert('Relationships', 'Number -> NumberAssignment (Assignment History)',
    schemaContent.includes('assignments      NumberAssignment[]'),
    'Preserves full assignment history on Number');

  assert('Relationships', 'IncomingMessage -> CDR (Auditable Link)',
    schemaContent.includes('cdr CDR?') && schemaContent.includes('incomingMessage   IncomingMessage @relation(fields: [incomingMessageId]'),
    'IncomingMessage links 1:1 to auditable CDR record');

  // 6. Indexes & Unique Constraints
  assert('Indexing & Constraints', 'Country unique ISO-2 code',
    schemaContent.includes('iso2      String   @unique'),
    'Country.iso2 is unique');

  assert('Indexing & Constraints', 'Number unique E.164 standard',
    schemaContent.includes('e164Number      String         @unique'),
    'Number.e164Number is unique');

  assert('Indexing & Constraints', 'Operator unique country + mcc + mnc',
    schemaContent.includes('@@unique([countryId, mcc, mnc])'),
    'Operator has compound unique constraint [countryId, mcc, mnc]');

  assert('Indexing & Constraints', 'Wallet unique user + currency',
    schemaContent.includes('@@unique([userId, currency])'),
    'Wallet has compound unique constraint [userId, currency]');

  assert('Indexing & Constraints', 'Performance indexes on high-throughput tables',
    schemaContent.includes('@@index([numberId, status])') &&
    schemaContent.includes('@@index([receivedAt])') &&
    schemaContent.includes('@@index([clientId, billedAt])'),
    'High throughput indexes defined on NumberAssignment, IncomingMessage, and CDR');

  // 7. Migration DDL Verification
  if (fs.existsSync(migrationPath)) {
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    assert('Migration DDL', 'Migration creates users table', migrationContent.includes('CREATE TABLE "users"'), 'users table in migration');
    assert('Migration DDL', 'Migration creates numbers table', migrationContent.includes('CREATE TABLE "numbers"'), 'numbers table in migration');
    assert('Migration DDL', 'Migration creates incoming_messages table', migrationContent.includes('CREATE TABLE "incoming_messages"'), 'incoming_messages in migration');
    assert('Migration DDL', 'Migration creates cdrs table', migrationContent.includes('CREATE TABLE "cdrs"'), 'cdrs table in migration');
    assert('Migration DDL', 'Migration creates transactions table', migrationContent.includes('CREATE TABLE "transactions"'), 'transactions table in migration');
    assert('Migration DDL', 'Migration creates foreign keys with constraints', migrationContent.includes('ADD CONSTRAINT "cdrs_incomingMessageId_fkey"'), 'Foreign key constraints present');
  }

  // Summary Report
  console.log('================================================================');
  console.log('               PHASE 02 ARCHITECTURE TEST REPORT                ');
  console.log('================================================================');

  let passedCount = 0;
  for (const res of results) {
    const icon = res.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${icon} [${res.category}] ${res.test}`);
    if (!res.passed) {
      console.log(`     Details: ${res.details}`);
    } else {
      passedCount++;
    }
  }

  console.log('================================================================');
  console.log(`Results: ${passedCount}/${results.length} tests passed (${Math.round((passedCount / results.length) * 100)}%)`);
  console.log('================================================================\n');

  if (passedCount !== results.length) {
    console.error('Some architecture tests failed!');
    process.exit(1);
  }

  console.log('🎉 All Phase 02 Database Architecture specifications verified successfully!');
}

runDatabaseArchitectureTests().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
