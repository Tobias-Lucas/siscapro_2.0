-- Prevent a bank/webhook payment reference from being applied twice for one title.
-- PostgreSQL permits multiple NULL externalRef values under this unique constraint.
CREATE UNIQUE INDEX IF NOT EXISTS "Payment_financialTitleId_externalRef_key" ON "Payment"("financialTitleId", "externalRef");
