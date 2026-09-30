CREATE TABLE "CarrierEvent" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "providerId" TEXT NOT NULL,
  "connectionId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "groupKey" TEXT,
  "status" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "CarrierEvent_connectionId_kind_idx" ON "CarrierEvent"("connectionId", "kind");
CREATE INDEX "CarrierEvent_groupKey_expiresAt_idx" ON "CarrierEvent"("groupKey", "expiresAt");
