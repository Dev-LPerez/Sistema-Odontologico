-- Ensure pg_trgm extension is active
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create GIN trigram indexes for fast fuzzy patient search (RF-B-012, RNF-B-031, RC-031)
CREATE INDEX IF NOT EXISTS "patients_first_name_trgm_idx" ON "patients" USING GIN ("first_name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "patients_last_name_trgm_idx" ON "patients" USING GIN ("last_name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "patients_document_number_trgm_idx" ON "patients" USING GIN ("document_number" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "patients_phone_trgm_idx" ON "patients" USING GIN ("phone" gin_trgm_ops);
