-- New accounts must not receive administrative rights or immediate access by default.
-- Existing accounts are unchanged; review V1 accounts manually before production.
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'RECEPTION';
ALTER TABLE "User" ALTER COLUMN "active" SET DEFAULT false;
