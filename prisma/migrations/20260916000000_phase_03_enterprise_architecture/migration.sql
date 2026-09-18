-- ================================================================================
-- PHASE 03 ENTERPRISE DATABASE ARCHITECTURE & MIGRATION
-- Additive DDL for Target Domain Models & Deterministic Micro-Unit Backfill DML
-- Preserves all 28 Phase-02 legacy tables untouched.
-- ================================================================================

-- Step 0: Pre-Migration Integrity Assertions (Stop-the-World Checks)
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  -- 1. Assert zero duplicate emails in users
  SELECT COUNT(*) INTO v_count FROM (SELECT email FROM "users" GROUP BY email HAVING COUNT(*) > 1) t;
  IF v_count > 0 THEN RAISE EXCEPTION 'FAIL: Duplicate emails exist in users table'; END IF;

  -- 2. Assert zero orphan roleId references
  SELECT COUNT(*) INTO v_count FROM "users" u LEFT JOIN "roles" r ON u."roleId" = r.id WHERE r.id IS NULL;
  IF v_count > 0 THEN RAISE EXCEPTION 'FAIL: Orphan roleId found in users table'; END IF;

  -- 3. Assert supported provider protocols
  SELECT COUNT(*) INTO v_count FROM "provider_connections" WHERE "protocol" NOT IN ('SMPP', 'HTTP', 'HTTP_REST', 'OTHER');
  IF v_count > 0 THEN RAISE EXCEPTION 'FAIL: Unsupported protocol in provider_connections table'; END IF;

  -- 4. Assert no provider has multiple credentials (guarantees deterministic connection mapping)
  SELECT COUNT(*) INTO v_count FROM (
    SELECT "providerId" FROM "provider_credentials" GROUP BY "providerId" HAVING COUNT(*) > 1
  ) t;
  IF v_count > 0 THEN RAISE EXCEPTION 'FAIL: Multiple credentials per provider found'; END IF;

  -- 5. Assert valid E.164 ranges
  SELECT COUNT(*) INTO v_count FROM "ranges" WHERE "startRange" !~ '^\+[0-9]+$' OR "endRange" !~ '^\+[0-9]+$';
  IF v_count > 0 THEN RAISE EXCEPTION 'FAIL: Non-E.164 phone ranges found'; END IF;

  -- 6. Assert range start <= end numerically
  SELECT COUNT(*) INTO v_count FROM "ranges" WHERE SUBSTRING("startRange" FROM 2)::BIGINT > SUBSTRING("endRange" FROM 2)::BIGINT;
  IF v_count > 0 THEN RAISE EXCEPTION 'FAIL: startRange exceeds endRange in ranges table'; END IF;

  -- 7. Assert at most one ACTIVE assignment per number
  SELECT COUNT(*) INTO v_count FROM (
    SELECT "numberId" FROM "number_assignments" WHERE "status" = 'ACTIVE' GROUP BY "numberId" HAVING COUNT(*) > 1
  ) t;
  IF v_count > 0 THEN RAISE EXCEPTION 'FAIL: Multiple ACTIVE assignments exist for a number'; END IF;

  -- 8. Assert zero duplicate provider messageRefs
  SELECT COUNT(*) INTO v_count FROM (
    SELECT "providerId", "messageRef" FROM "incoming_messages" 
    WHERE "messageRef" IS NOT NULL GROUP BY "providerId", "messageRef" HAVING COUNT(*) > 1
  ) t;
  IF v_count > 0 THEN RAISE EXCEPTION 'FAIL: Duplicate provider messageRef in incoming_messages'; END IF;

  -- 9. Assert exactly one profile owner per wallet
  SELECT COUNT(*) INTO v_count FROM "wallets" w
  LEFT JOIN "agent_profiles" ap ON ap."userId" = w."userId"
  LEFT JOIN "client_profiles" cp ON cp."userId" = w."userId"
  WHERE (CASE WHEN ap.id IS NOT NULL THEN 1 ELSE 0 END + CASE WHEN cp.id IS NOT NULL THEN 1 ELSE 0 END) <> 1;
  IF v_count > 0 THEN RAISE EXCEPTION 'FAIL: Ambiguous wallet ownership in wallets table'; END IF;

  -- 10. Assert CDR incomingMessageId references exist
  SELECT COUNT(*) INTO v_count FROM "cdrs" c LEFT JOIN "incoming_messages" im ON im.id = c."incomingMessageId" WHERE im.id IS NULL;
  IF v_count > 0 THEN RAISE EXCEPTION 'FAIL: Orphan incomingMessageId in cdrs table'; END IF;
END $$;

-- ================================================================================
-- 1. CREATE ENUMS
-- ================================================================================

DO $$ BEGIN
  CREATE TYPE "ProviderConnectionType" AS ENUM ('HTTP', 'SMPP', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProviderStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DISABLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "InboundStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'ROUTED', 'UNROUTED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "BillingStatus" AS ENUM ('PENDING', 'BILLED', 'ERROR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RateType" AS ENUM ('INBOUND', 'OUTBOUND', 'DELIVERY_REPORT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LedgerEntryType" AS ENUM ('CREDIT', 'DEBIT', 'REFUND', 'ADJUSTMENT', 'FEE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "LedgerSourceType" AS ENUM ('RATE', 'BILLING_EVENT', 'CREDIT_NOTE', 'PAYMENT_REQUEST', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'ALERT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ================================================================================
-- 2. CREATE TARGET TABLES & CONSTRAINTS
-- ================================================================================

-- Organization
CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User"("organizationId");

-- Role
CREATE TABLE IF NOT EXISTS "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Role_name_key" ON "Role"("name");

-- UserRole
CREATE TABLE IF NOT EXISTS "UserRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- Permission
CREATE TABLE IF NOT EXISTS "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Permission_name_key" ON "Permission"("name");

-- RolePermission
CREATE TABLE IF NOT EXISTS "RolePermission" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- ManagerProfile
CREATE TABLE IF NOT EXISTS "ManagerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ManagerProfile_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ManagerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ManagerProfile_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ManagerProfile_userId_key" ON "ManagerProfile"("userId");
CREATE INDEX IF NOT EXISTS "ManagerProfile_organizationId_idx" ON "ManagerProfile"("organizationId");

-- Agent
CREATE TABLE IF NOT EXISTS "Agent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "managerProfileId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Agent_managerProfileId_fkey" FOREIGN KEY ("managerProfileId") REFERENCES "ManagerProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Agent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Agent_userId_key" ON "Agent"("userId");
CREATE INDEX IF NOT EXISTS "Agent_managerProfileId_idx" ON "Agent"("managerProfileId");
CREATE INDEX IF NOT EXISTS "Agent_organizationId_idx" ON "Agent"("organizationId");

-- Client
CREATE TABLE IF NOT EXISTS "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agentId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Client_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Client_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Client_agentId_idx" ON "Client"("agentId");
CREATE INDEX IF NOT EXISTS "Client_organizationId_idx" ON "Client"("organizationId");

-- ClientUser
CREATE TABLE IF NOT EXISTS "ClientUser" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "ClientUser_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ClientUser_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClientUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ClientUser_clientId_userId_key" ON "ClientUser"("clientId", "userId");
CREATE INDEX IF NOT EXISTS "ClientUser_clientId_idx" ON "ClientUser"("clientId");
CREATE INDEX IF NOT EXISTS "ClientUser_userId_idx" ON "ClientUser"("userId");

-- Provider
CREATE TABLE IF NOT EXISTS "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ProviderStatus" NOT NULL DEFAULT 'ACTIVE',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Provider_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Provider_organizationId_idx" ON "Provider"("organizationId");
CREATE INDEX IF NOT EXISTS "Provider_status_idx" ON "Provider"("status");

-- CredentialReference
CREATE TABLE IF NOT EXISTS "CredentialReference" (
    "id" TEXT NOT NULL,
    "label" TEXT,
    "ciphertext" TEXT,
    "keyVersion" TEXT,
    "rotatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CredentialReference_pkey" PRIMARY KEY ("id")
);

-- ProviderConnection
CREATE TABLE IF NOT EXISTS "ProviderConnection" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "connectionType" "ProviderConnectionType" NOT NULL,
    "environment" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "protocolConfig" JSONB,
    "credentialRefId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProviderConnection_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProviderConnection_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProviderConnection_credentialRefId_fkey" FOREIGN KEY ("credentialRefId") REFERENCES "CredentialReference"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ProviderConnection_providerId_idx" ON "ProviderConnection"("providerId");
CREATE INDEX IF NOT EXISTS "ProviderConnection_status_idx" ON "ProviderConnection"("status");

-- Country
CREATE TABLE IF NOT EXISTS "Country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isoCode" TEXT NOT NULL,
    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Country_isoCode_key" ON "Country"("isoCode");

-- Operator
CREATE TABLE IF NOT EXISTS "Operator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Operator_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Operator_countryId_idx" ON "Operator"("countryId");

-- Range
CREATE TABLE IF NOT EXISTS "Range" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerRangeId" TEXT,
    "countryId" TEXT NOT NULL,
    "operatorId" TEXT,
    "organizationId" TEXT NOT NULL,
    "startE164" TEXT NOT NULL,
    "endE164" TEXT NOT NULL,
    "startNum" BIGINT NOT NULL,
    "endNum" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Range_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Range_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Range_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Range_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Range_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Range_countryId_idx" ON "Range"("countryId");
CREATE INDEX IF NOT EXISTS "Range_operatorId_idx" ON "Range"("operatorId");
CREATE INDEX IF NOT EXISTS "Range_status_idx" ON "Range"("status");
CREATE INDEX IF NOT EXISTS "Range_organizationId_idx" ON "Range"("organizationId");

-- Number
CREATE TABLE IF NOT EXISTS "Number" (
    "id" TEXT NOT NULL,
    "e164" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "operatorId" TEXT,
    "rangeId" TEXT,
    "providerNumberId" TEXT,
    "organizationId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Number_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Number_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Number_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Number_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Number_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Number_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Number_e164_key" ON "Number"("e164");
CREATE INDEX IF NOT EXISTS "Number_countryId_idx" ON "Number"("countryId");
CREATE INDEX IF NOT EXISTS "Number_operatorId_idx" ON "Number"("operatorId");
CREATE INDEX IF NOT EXISTS "Number_rangeId_idx" ON "Number"("rangeId");
CREATE INDEX IF NOT EXISTS "Number_status_idx" ON "Number"("status");
CREATE INDEX IF NOT EXISTS "Number_organizationId_idx" ON "Number"("organizationId");

-- ActiveAssignment (Singleton per number)
CREATE TABLE IF NOT EXISTS "ActiveAssignment" (
    "id" TEXT NOT NULL,
    "numberId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agentId" TEXT,
    "organizationId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ActiveAssignment_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ActiveAssignment_numberId_fkey" FOREIGN KEY ("numberId") REFERENCES "Number"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActiveAssignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActiveAssignment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActiveAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "ActiveAssignment_numberId_key" ON "ActiveAssignment"("numberId");
CREATE INDEX IF NOT EXISTS "ActiveAssignment_clientId_idx" ON "ActiveAssignment"("clientId");
CREATE INDEX IF NOT EXISTS "ActiveAssignment_agentId_idx" ON "ActiveAssignment"("agentId");
CREATE INDEX IF NOT EXISTS "ActiveAssignment_organizationId_idx" ON "ActiveAssignment"("organizationId");

-- AssignmentHistory
CREATE TABLE IF NOT EXISTS "AssignmentHistory" (
    "id" TEXT NOT NULL,
    "numberId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agentId" TEXT,
    "organizationId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssignmentHistory_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AssignmentHistory_numberId_fkey" FOREIGN KEY ("numberId") REFERENCES "Number"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AssignmentHistory_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AssignmentHistory_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AssignmentHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AssignmentHistory_numberId_idx" ON "AssignmentHistory"("numberId");
CREATE INDEX IF NOT EXISTS "AssignmentHistory_clientId_idx" ON "AssignmentHistory"("clientId");
CREATE INDEX IF NOT EXISTS "AssignmentHistory_agentId_idx" ON "AssignmentHistory"("agentId");
CREATE INDEX IF NOT EXISTS "AssignmentHistory_organizationId_idx" ON "AssignmentHistory"("organizationId");
CREATE INDEX IF NOT EXISTS "AssignmentHistory_assignedAt_idx" ON "AssignmentHistory"("assignedAt");

-- InboundMessage
CREATE TABLE IF NOT EXISTS "InboundMessage" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerMessageId" TEXT,
    "numberId" TEXT NOT NULL,
    "assignmentId" TEXT,
    "clientId" TEXT,
    "agentId" TEXT,
    "fromNumber" TEXT NOT NULL,
    "toNumber" TEXT NOT NULL,
    "body" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL,
    "providerReceivedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "status" "InboundStatus" NOT NULL DEFAULT 'RECEIVED',
    "billingStatus" "BillingStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InboundMessage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "InboundMessage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InboundMessage_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InboundMessage_numberId_fkey" FOREIGN KEY ("numberId") REFERENCES "Number"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InboundMessage_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "ActiveAssignment"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InboundMessage_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InboundMessage_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "InboundMessage_providerId_providerMessageId_key" ON "InboundMessage"("providerId", "providerMessageId");
CREATE INDEX IF NOT EXISTS "InboundMessage_organizationId_idx" ON "InboundMessage"("organizationId");
CREATE INDEX IF NOT EXISTS "InboundMessage_providerId_idx" ON "InboundMessage"("providerId");
CREATE INDEX IF NOT EXISTS "InboundMessage_numberId_idx" ON "InboundMessage"("numberId");
CREATE INDEX IF NOT EXISTS "InboundMessage_clientId_idx" ON "InboundMessage"("clientId");
CREATE INDEX IF NOT EXISTS "InboundMessage_status_idx" ON "InboundMessage"("status");
CREATE INDEX IF NOT EXISTS "InboundMessage_billingStatus_idx" ON "InboundMessage"("billingStatus");
CREATE INDEX IF NOT EXISTS "InboundMessage_receivedAt_idx" ON "InboundMessage"("receivedAt");

-- Rate
CREATE TABLE IF NOT EXISTS "Rate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "providerId" TEXT,
    "countryId" TEXT,
    "operatorId" TEXT,
    "rangeId" TEXT,
    "clientId" TEXT,
    "type" "RateType" NOT NULL,
    "amountMicrounits" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Rate_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Rate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Rate_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Rate_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Rate_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Rate_rangeId_fkey" FOREIGN KEY ("rangeId") REFERENCES "Range"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Rate_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Rate_organizationId_idx" ON "Rate"("organizationId");
CREATE INDEX IF NOT EXISTS "Rate_providerId_idx" ON "Rate"("providerId");
CREATE INDEX IF NOT EXISTS "Rate_countryId_idx" ON "Rate"("countryId");
CREATE INDEX IF NOT EXISTS "Rate_operatorId_idx" ON "Rate"("operatorId");
CREATE INDEX IF NOT EXISTS "Rate_isActive_idx" ON "Rate"("isActive");
CREATE INDEX IF NOT EXISTS "Rate_effectiveFrom_idx" ON "Rate"("effectiveFrom");

-- BillingEvent
CREATE TABLE IF NOT EXISTS "BillingEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "inboundMessageId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "numberId" TEXT NOT NULL,
    "clientId" TEXT,
    "agentId" TEXT,
    "rateId" TEXT,
    "providerCostMicrounits" BIGINT NOT NULL,
    "clientChargeMicrounits" BIGINT NOT NULL,
    "agentCommissionMicrounits" BIGINT,
    "platformMarginMicrounits" BIGINT,
    "currency" TEXT NOT NULL,
    "status" "BillingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BillingEvent_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BillingEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BillingEvent_inboundMessageId_fkey" FOREIGN KEY ("inboundMessageId") REFERENCES "InboundMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BillingEvent_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BillingEvent_numberId_fkey" FOREIGN KEY ("numberId") REFERENCES "Number"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BillingEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BillingEvent_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BillingEvent_rateId_fkey" FOREIGN KEY ("rateId") REFERENCES "Rate"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BillingEvent_organizationId_idx" ON "BillingEvent"("organizationId");
CREATE INDEX IF NOT EXISTS "BillingEvent_inboundMessageId_idx" ON "BillingEvent"("inboundMessageId");
CREATE INDEX IF NOT EXISTS "BillingEvent_providerId_idx" ON "BillingEvent"("providerId");
CREATE INDEX IF NOT EXISTS "BillingEvent_numberId_idx" ON "BillingEvent"("numberId");
CREATE INDEX IF NOT EXISTS "BillingEvent_clientId_idx" ON "BillingEvent"("clientId");
CREATE INDEX IF NOT EXISTS "BillingEvent_status_idx" ON "BillingEvent"("status");
CREATE INDEX IF NOT EXISTS "BillingEvent_createdAt_idx" ON "BillingEvent"("createdAt");

-- Cdr
CREATE TABLE IF NOT EXISTS "Cdr" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "inboundMessageId" TEXT,
    "providerId" TEXT NOT NULL,
    "numberId" TEXT NOT NULL,
    "clientId" TEXT,
    "agentId" TEXT,
    "billingEventId" TEXT,
    "providerCostMicrounits" BIGINT NOT NULL,
    "clientChargeMicrounits" BIGINT NOT NULL,
    "agentCommissionMicrounits" BIGINT,
    "platformProfitMicrounits" BIGINT,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Cdr_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Cdr_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cdr_inboundMessageId_fkey" FOREIGN KEY ("inboundMessageId") REFERENCES "InboundMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Cdr_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cdr_numberId_fkey" FOREIGN KEY ("numberId") REFERENCES "Number"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cdr_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Cdr_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Cdr_billingEventId_fkey" FOREIGN KEY ("billingEventId") REFERENCES "BillingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Cdr_billingEventId_key" ON "Cdr"("billingEventId");
CREATE INDEX IF NOT EXISTS "Cdr_organizationId_idx" ON "Cdr"("organizationId");
CREATE INDEX IF NOT EXISTS "Cdr_providerId_idx" ON "Cdr"("providerId");
CREATE INDEX IF NOT EXISTS "Cdr_numberId_idx" ON "Cdr"("numberId");
CREATE INDEX IF NOT EXISTS "Cdr_clientId_idx" ON "Cdr"("clientId");
CREATE INDEX IF NOT EXISTS "Cdr_createdAt_idx" ON "Cdr"("createdAt");

-- Wallet
CREATE TABLE IF NOT EXISTS "Wallet" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT,
    "agentId" TEXT,
    "providerId" TEXT,
    "isPlatform" BOOLEAN NOT NULL DEFAULT false,
    "balanceMicrounits" BIGINT NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Wallet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Wallet_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Wallet_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Wallet_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Wallet_exactly_one_owner_check" CHECK (
        (CASE WHEN "clientId" IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN "agentId" IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN "providerId" IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN "isPlatform" = true THEN 1 ELSE 0 END) = 1
    )
);
CREATE UNIQUE INDEX IF NOT EXISTS "Wallet_clientId_key" ON "Wallet"("clientId");
CREATE UNIQUE INDEX IF NOT EXISTS "Wallet_agentId_key" ON "Wallet"("agentId");
CREATE UNIQUE INDEX IF NOT EXISTS "Wallet_providerId_key" ON "Wallet"("providerId");
CREATE INDEX IF NOT EXISTS "Wallet_organizationId_idx" ON "Wallet"("organizationId");

-- BillingTransaction
CREATE TABLE IF NOT EXISTS "BillingTransaction" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amountMicrounits" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BillingTransaction_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BillingTransaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BillingTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "BillingTransaction_organizationId_idx" ON "BillingTransaction"("organizationId");
CREATE INDEX IF NOT EXISTS "BillingTransaction_walletId_idx" ON "BillingTransaction"("walletId");
CREATE INDEX IF NOT EXISTS "BillingTransaction_status_idx" ON "BillingTransaction"("status");

-- LedgerEntry
CREATE TABLE IF NOT EXISTS "LedgerEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amountMicrounits" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "sourceType" "LedgerSourceType" NOT NULL,
    "sourceId" TEXT,
    "billingTransactionId" TEXT,
    "billingEventId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LedgerEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LedgerEntry_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LedgerEntry_billingTransactionId_fkey" FOREIGN KEY ("billingTransactionId") REFERENCES "BillingTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LedgerEntry_billingEventId_fkey" FOREIGN KEY ("billingEventId") REFERENCES "BillingEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "LedgerEntry_walletId_idx" ON "LedgerEntry"("walletId");
CREATE INDEX IF NOT EXISTS "LedgerEntry_billingEventId_idx" ON "LedgerEntry"("billingEventId");
CREATE INDEX IF NOT EXISTS "LedgerEntry_createdAt_idx" ON "LedgerEntry"("createdAt");
CREATE INDEX IF NOT EXISTS "LedgerEntry_organizationId_idx" ON "LedgerEntry"("organizationId");

-- CreditNote
CREATE TABLE IF NOT EXISTS "CreditNote" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "approverId" TEXT,
    "amountMicrounits" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CreditNote_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CreditNote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CreditNote_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CreditNote_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CreditNote_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "CreditNote_organizationId_idx" ON "CreditNote"("organizationId");
CREATE INDEX IF NOT EXISTS "CreditNote_walletId_idx" ON "CreditNote"("walletId");
CREATE INDEX IF NOT EXISTS "CreditNote_requesterId_idx" ON "CreditNote"("requesterId");

-- PaymentRequest
CREATE TABLE IF NOT EXISTS "PaymentRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "approverId" TEXT,
    "amountMicrounits" BIGINT NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentRequest_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PaymentRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentRequest_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PaymentRequest_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "PaymentRequest_organizationId_idx" ON "PaymentRequest"("organizationId");
CREATE INDEX IF NOT EXISTS "PaymentRequest_walletId_idx" ON "PaymentRequest"("walletId");
CREATE INDEX IF NOT EXISTS "PaymentRequest_requesterId_idx" ON "PaymentRequest"("requesterId");

-- Notification
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Notification_organizationId_idx" ON "Notification"("organizationId");
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");

-- ApiCredential
CREATE TABLE IF NOT EXISTS "ApiCredential" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "hashedToken" TEXT NOT NULL,
    "scopes" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiCredential_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ApiCredential_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ApiCredential_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ApiCredential_organizationId_idx" ON "ApiCredential"("organizationId");
CREATE INDEX IF NOT EXISTS "ApiCredential_ownerUserId_idx" ON "ApiCredential"("ownerUserId");

-- ApiRequestLog
CREATE TABLE IF NOT EXISTS "ApiRequestLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "apiCredentialId" TEXT,
    "requestId" TEXT,
    "method" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApiRequestLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ApiRequestLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ApiRequestLog_apiCredentialId_fkey" FOREIGN KEY ("apiCredentialId") REFERENCES "ApiCredential"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "ApiRequestLog_organizationId_idx" ON "ApiRequestLog"("organizationId");
CREATE INDEX IF NOT EXISTS "ApiRequestLog_apiCredentialId_idx" ON "ApiRequestLog"("apiCredentialId");
CREATE INDEX IF NOT EXISTS "ApiRequestLog_createdAt_idx" ON "ApiRequestLog"("createdAt");

-- AuditLog
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "performedById" TEXT,
    "entityName" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
CREATE INDEX IF NOT EXISTS "AuditLog_performedById_idx" ON "AuditLog"("performedById");
CREATE INDEX IF NOT EXISTS "AuditLog_entityName_entityId_idx" ON "AuditLog"("entityName", "entityId");
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- ================================================================================
-- 3. DETERMINISTIC DATA BACKFILL DML (SOURCE -> TARGET)
-- ================================================================================

-- A. Default Organization Seeding
INSERT INTO "Organization" ("id", "name", "createdAt", "updatedAt")
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Enterprise Platform', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

-- B. Roles
INSERT INTO "Role" ("id", "name")
SELECT "id", "name" FROM "roles"
ON CONFLICT ("id") DO NOTHING;

-- C. Permissions
INSERT INTO "Permission" ("id", "name")
SELECT "id", "code" FROM "permissions"
ON CONFLICT ("id") DO NOTHING;

-- D. RolePermission Junction
INSERT INTO "RolePermission" ("id", "roleId", "permissionId")
SELECT "id", "roleId", "permissionId" FROM "role_permissions"
ON CONFLICT ("id") DO NOTHING;

-- E. Users (Concatenating firstName and lastName into name)
INSERT INTO "User" ("id", "email", "passwordHash", "name", "status", "organizationId", "createdAt", "updatedAt")
SELECT 
    u."id",
    u."email",
    u."passwordHash",
    TRIM(COALESCE(u."firstName", '') || ' ' || COALESCE(u."lastName", '')),
    u."status",
    '00000000-0000-0000-0000-000000000001',
    u."createdAt",
    u."updatedAt"
FROM "users" u
ON CONFLICT ("id") DO NOTHING;

-- F. UserRole Junction
INSERT INTO "UserRole" ("id", "userId", "roleId")
SELECT 
    gen_random_uuid()::TEXT,
    u."id",
    u."roleId"
FROM "users" u
ON CONFLICT ("userId", "roleId") DO NOTHING;

-- G. ManagerProfiles
INSERT INTO "ManagerProfile" ("id", "userId", "organizationId", "createdAt", "updatedAt")
SELECT 
    mp."id", 
    mp."userId", 
    '00000000-0000-0000-0000-000000000001', 
    mp."createdAt", 
    mp."updatedAt"
FROM "manager_profiles" mp
ON CONFLICT ("id") DO NOTHING;

-- H. Agents
INSERT INTO "Agent" ("id", "userId", "managerProfileId", "organizationId", "createdAt", "updatedAt")
SELECT 
    ap."id",
    ap."userId",
    ap."managerId",
    '00000000-0000-0000-0000-000000000001',
    ap."createdAt",
    ap."updatedAt"
FROM "agent_profiles" ap
ON CONFLICT ("id") DO NOTHING;

-- I. Clients
INSERT INTO "Client" ("id", "name", "agentId", "organizationId", "createdAt", "updatedAt")
SELECT 
    cp."id",
    COALESCE(cp."companyName", 'Client ' || cp."id"),
    cp."agentId",
    '00000000-0000-0000-0000-000000000001',
    cp."createdAt",
    cp."updatedAt"
FROM "client_profiles" cp
ON CONFLICT ("id") DO NOTHING;

-- J. ClientUser Memberships
INSERT INTO "ClientUser" ("id", "clientId", "userId")
SELECT 
    gen_random_uuid()::TEXT,
    cp."id",
    cp."userId"
FROM "client_profiles" cp
ON CONFLICT ("clientId", "userId") DO NOTHING;

-- K. Providers
INSERT INTO "Provider" ("id", "name", "status", "organizationId", "createdAt", "updatedAt")
SELECT 
    p."id",
    p."name",
    CASE 
        WHEN p."status" = 'SUSPENDED' THEN 'SUSPENDED'::"ProviderStatus"
        WHEN p."status" = 'DISABLED' THEN 'DISABLED'::"ProviderStatus"
        ELSE 'ACTIVE'::"ProviderStatus"
    END,
    '00000000-0000-0000-0000-000000000001',
    p."createdAt",
    p."updatedAt"
FROM "providers" p
ON CONFLICT ("id") DO NOTHING;

-- L. CredentialReferences (Encrypted envelope preserved without exposing secrets)
INSERT INTO "CredentialReference" ("id", "label", "ciphertext", "keyVersion", "createdAt", "updatedAt")
SELECT 
    pc."id",
    pc."name",
    jsonb_build_object(
        'iv', pc."iv",
        'data', pc."encryptedSecret"
    )::TEXT,
    pc."keyReference",
    pc."createdAt",
    pc."updatedAt"
FROM "provider_credentials" pc
ON CONFLICT ("id") DO NOTHING;

-- M. ProviderConnections
INSERT INTO "ProviderConnection" (
    "id", "providerId", "connectionType", "environment", "status", "priority", "protocolConfig", "credentialRefId", "createdAt", "updatedAt"
)
SELECT 
    pconn."id",
    pconn."providerId",
    CASE 
        WHEN pconn."protocol" = 'SMPP' THEN 'SMPP'::"ProviderConnectionType"
        WHEN pconn."protocol" IN ('HTTP', 'HTTP_REST') THEN 'HTTP'::"ProviderConnectionType"
        ELSE 'OTHER'::"ProviderConnectionType"
    END,
    'PRODUCTION',
    CASE WHEN pconn."isActive" THEN 'ACTIVE' ELSE 'INACTIVE' END,
    1,
    jsonb_build_object(
        'host', pconn."host",
        'port', pconn."port",
        'systemId', pconn."systemId",
        'bindType', pconn."bindType",
        'throughputLimit', pconn."throughputLimit"
    ),
    pcred."id" AS "credentialRefId",
    pconn."createdAt",
    pconn."updatedAt"
FROM "provider_connections" pconn
LEFT JOIN "provider_credentials" pcred ON pcred."providerId" = pconn."providerId"
ON CONFLICT ("id") DO NOTHING;

-- N. Countries & Operators
INSERT INTO "Country" ("id", "name", "isoCode")
SELECT "id", "name", "iso2" FROM "countries"
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Operator" ("id", "name", "countryId")
SELECT "id", "name", "countryId" FROM "operators"
ON CONFLICT ("id") DO NOTHING;

-- O. Ranges
INSERT INTO "Range" (
    "id", "providerId", "countryId", "operatorId", "organizationId", 
    "startE164", "endE164", "startNum", "endNum", "status", "createdAt", "updatedAt"
)
SELECT 
    r."id",
    r."providerId",
    r."countryId",
    r."operatorId",
    '00000000-0000-0000-0000-000000000001',
    r."startRange",
    r."endRange",
    SUBSTRING(r."startRange" FROM 2)::BIGINT,
    SUBSTRING(r."endRange" FROM 2)::BIGINT,
    r."status",
    r."createdAt",
    r."updatedAt"
FROM "ranges" r
ON CONFLICT ("id") DO NOTHING;

-- P. Numbers
INSERT INTO "Number" (
    "id", "e164", "providerId", "countryId", "operatorId", "rangeId", "organizationId", "status", "createdAt", "updatedAt"
)
SELECT 
    n."id",
    n."e164Number",
    n."providerId",
    n."countryId",
    n."operatorId",
    n."rangeId",
    '00000000-0000-0000-0000-000000000001',
    n."status",
    n."createdAt",
    n."updatedAt"
FROM "numbers" n
ON CONFLICT ("id") DO NOTHING;

-- Q. ActiveAssignments (Only ACTIVE assignments, exactly one per number)
INSERT INTO "ActiveAssignment" ("id", "numberId", "clientId", "agentId", "organizationId", "assignedAt", "createdAt", "updatedAt")
SELECT 
    na."id",
    na."numberId",
    na."clientId",
    cp."agentId",
    '00000000-0000-0000-0000-000000000001',
    na."assignedAt",
    na."createdAt",
    na."updatedAt"
FROM "number_assignments" na
JOIN "client_profiles" cp ON cp."id" = na."clientId"
WHERE na."status" = 'ACTIVE'
ON CONFLICT ("numberId") DO NOTHING;

-- R. AssignmentHistory (All historical assignments)
INSERT INTO "AssignmentHistory" ("id", "numberId", "clientId", "agentId", "organizationId", "assignedAt", "endedAt", "createdAt")
SELECT 
    na."id",
    na."numberId",
    na."clientId",
    cp."agentId",
    '00000000-0000-0000-0000-000000000001',
    na."assignedAt",
    na."releasedAt",
    na."createdAt"
FROM "number_assignments" na
JOIN "client_profiles" cp ON cp."id" = na."clientId"
ON CONFLICT ("id") DO NOTHING;

-- S. InboundMessages
INSERT INTO "InboundMessage" (
    "id", "organizationId", "providerId", "providerMessageId", "numberId", "assignmentId",
    "clientId", "agentId", "fromNumber", "toNumber", "body", "receivedAt", "status", "billingStatus", "createdAt"
)
SELECT 
    im."id",
    '00000000-0000-0000-0000-000000000001',
    im."providerId",
    im."messageRef",
    im."numberId",
    aa."id",
    im."clientId",
    aa."agentId",
    im."senderAddress",
    im."destinationAddress",
    im."messageBody",
    im."receivedAt",
    'RECEIVED'::"InboundStatus",
    'BILLED'::"BillingStatus",
    im."createdAt"
FROM "incoming_messages" im
LEFT JOIN "ActiveAssignment" aa ON aa."numberId" = im."numberId"
ON CONFLICT ("id") DO NOTHING;

-- T. Rates (Provider Cost Rates and Client Payout Rates converted to micro-units)
INSERT INTO "Rate" (
    "id", "organizationId", "providerId", "countryId", "rangeId", "type", 
    "amountMicrounits", "currency", "effectiveFrom", "effectiveTo", "isActive", "createdAt", "updatedAt"
)
SELECT 
    r."id",
    '00000000-0000-0000-0000-000000000001',
    r."providerId",
    r."countryId",
    r."rangeId",
    'INBOUND'::"RateType",
    ROUND(r."costPerSms" * 1000000)::BIGINT,
    r."currency",
    r."effectiveFrom",
    r."effectiveTo",
    CASE WHEN r."status" = 'ACTIVE' THEN true ELSE false END,
    r."createdAt",
    r."updatedAt"
FROM "rates" r
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Rate" (
    "id", "organizationId", "clientId", "countryId", "rangeId", "type", 
    "amountMicrounits", "currency", "effectiveFrom", "effectiveTo", "isActive", "createdAt", "updatedAt"
)
SELECT 
    cp."id",
    '00000000-0000-0000-0000-000000000001',
    cp."clientId",
    cp."countryId",
    cp."rangeId",
    'INBOUND'::"RateType",
    ROUND(cp."payoutPerSms" * 1000000)::BIGINT,
    COALESCE(cp."currency", 'USD'),
    NOW(),
    NULL,
    true,
    cp."createdAt",
    cp."updatedAt"
FROM "client_payouts" cp
ON CONFLICT ("id") DO NOTHING;

-- U. BillingEvents & CDRs (Micro-unit precision 1 currency = 1,000,000 micro-units)
INSERT INTO "BillingEvent" (
    "id", "organizationId", "inboundMessageId", "providerId", "numberId", "clientId", "agentId",
    "providerCostMicrounits", "clientChargeMicrounits", "agentCommissionMicrounits", "platformMarginMicrounits",
    "currency", "status", "createdAt"
)
SELECT 
    ('be-' || c."id"),
    '00000000-0000-0000-0000-000000000001',
    c."incomingMessageId",
    c."providerId",
    c."numberId",
    c."clientId",
    c."agentId",
    ROUND(c."providerCost" * 1000000)::BIGINT,
    ROUND(c."clientPayout" * 1000000)::BIGINT,
    ROUND(c."agentCommission" * 1000000)::BIGINT,
    ROUND(c."netProfit" * 1000000)::BIGINT,
    c."currency",
    'BILLED'::"BillingStatus",
    c."createdAt"
FROM "cdrs" c
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Cdr" (
    "id", "organizationId", "inboundMessageId", "providerId", "numberId", "clientId", "agentId", "billingEventId",
    "providerCostMicrounits", "clientChargeMicrounits", "agentCommissionMicrounits", "platformProfitMicrounits",
    "currency", "createdAt"
)
SELECT 
    c."id",
    '00000000-0000-0000-0000-000000000001',
    c."incomingMessageId",
    c."providerId",
    c."numberId",
    c."clientId",
    c."agentId",
    ('be-' || c."id"),
    ROUND(c."providerCost" * 1000000)::BIGINT,
    ROUND(c."clientPayout" * 1000000)::BIGINT,
    ROUND(c."agentCommission" * 1000000)::BIGINT,
    ROUND(c."netProfit" * 1000000)::BIGINT,
    c."currency",
    c."createdAt"
FROM "cdrs" c
ON CONFLICT ("id") DO NOTHING;

-- V. Wallets (Preserving Agent/Client Ownership and Micro-Units)
INSERT INTO "Wallet" (
    "id", "organizationId", "agentId", "clientId", "isPlatform", "balanceMicrounits", "currency", "createdAt", "updatedAt"
)
SELECT 
    w."id",
    '00000000-0000-0000-0000-000000000001',
    ap."id" AS "agentId",
    cp."id" AS "clientId",
    false,
    ROUND(w."balance" * 1000000)::BIGINT,
    w."currency",
    w."createdAt",
    w."updatedAt"
FROM "wallets" w
LEFT JOIN "agent_profiles" ap ON ap."userId" = w."userId"
LEFT JOIN "client_profiles" cp ON cp."userId" = w."userId"
WHERE (ap.id IS NOT NULL OR cp.id IS NOT NULL)
ON CONFLICT ("id") DO NOTHING;

-- Create default platform wallet if none exists
INSERT INTO "Wallet" ("id", "organizationId", "isPlatform", "balanceMicrounits", "currency", "createdAt", "updatedAt")
VALUES ('wallet-platform-0001', '00000000-0000-0000-0000-000000000001', true, 0, 'USD', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- W. BillingTransactions & LedgerEntries
INSERT INTO "BillingTransaction" (
    "id", "organizationId", "walletId", "amountMicrounits", "currency", "status", "description", "createdAt", "updatedAt"
)
SELECT 
    t."id",
    '00000000-0000-0000-0000-000000000001',
    t."walletId",
    ROUND(t."amount" * 1000000)::BIGINT,
    t."currency",
    'COMPLETED',
    t."description",
    t."createdAt",
    t."createdAt"
FROM "transactions" t
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "LedgerEntry" (
    "id", "organizationId", "walletId", "amountMicrounits", "currency", "type", "sourceType", "billingTransactionId", "createdAt"
)
SELECT 
    ('le-' || t."id"),
    '00000000-0000-0000-0000-000000000001',
    t."walletId",
    ROUND(t."amount" * 1000000)::BIGINT,
    t."currency",
    'CREDIT'::"LedgerEntryType",
    'OTHER'::"LedgerSourceType",
    t."id",
    t."createdAt"
FROM "transactions" t
ON CONFLICT ("id") DO NOTHING;

-- X. AuditLogs
INSERT INTO "AuditLog" (
    "id", "organizationId", "performedById", "entityName", "entityId", "action", "result", "ipAddress", "userAgent", "changes", "createdAt"
)
SELECT 
    al."id",
    '00000000-0000-0000-0000-000000000001',
    al."userId",
    al."entityType",
    COALESCE(al."entityId", 'SYSTEM'),
    al."action",
    'SUCCESS',
    al."ipAddress",
    al."userAgent",
    al."metadata",
    al."createdAt"
FROM "audit_logs" al
ON CONFLICT ("id") DO NOTHING;
