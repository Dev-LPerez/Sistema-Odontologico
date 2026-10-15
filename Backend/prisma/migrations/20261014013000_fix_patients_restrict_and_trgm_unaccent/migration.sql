-- DropForeignKey
ALTER TABLE "patients" DROP CONSTRAINT IF EXISTS "patients_clinic_id_fkey";

-- AddForeignKey with ON DELETE RESTRICT (RF-B-010, RC-055)
ALTER TABLE "patients" ADD CONSTRAINT "patients_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateExtension unaccent
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Create immutable wrapper for unaccent to allow functional GIN indexing
CREATE OR REPLACE FUNCTION immutable_unaccent(text)
  RETURNS text AS
$func$
SELECT public.unaccent('public.unaccent', $1)
$func$ LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT;

-- Drop obsolete single-column first/last trigram indexes
DROP INDEX IF EXISTS "patients_first_name_trgm_idx";
DROP INDEX IF EXISTS "patients_last_name_trgm_idx";

-- Create combined full_name unaccented GIN trigram index (RF-B-012, RNF-B-031, RC-031)
CREATE INDEX IF NOT EXISTS "patients_full_name_unaccent_trgm_idx" ON "patients" USING GIN ((immutable_unaccent("first_name" || ' ' || "last_name")) gin_trgm_ops);
