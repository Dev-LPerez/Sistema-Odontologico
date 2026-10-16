-- CreateTable
CREATE TABLE "clinical_history_versions" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "clinical_history_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "previous_data" JSONB NOT NULL,
    "change_reason" TEXT,
    "updated_by_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_history_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clinical_history_versions_clinic_history_version_key" ON "clinical_history_versions"("clinic_id", "clinical_history_id", "version_number");

-- CreateIndex
CREATE INDEX "clinical_history_versions_clinic_id_clinical_history_id_idx" ON "clinical_history_versions"("clinic_id", "clinical_history_id");

-- AddForeignKey
ALTER TABLE "clinical_history_versions" ADD CONSTRAINT "clinical_history_versions_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_history_versions" ADD CONSTRAINT "clinical_history_versions_clinical_history_id_fkey" FOREIGN KEY ("clinical_history_id") REFERENCES "clinical_histories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop redundant indexes that duplicate unique constraints
DROP INDEX IF EXISTS "clinical_histories_clinic_id_patient_id_idx";
DROP INDEX IF EXISTS "odontograms_clinic_id_patient_id_idx";
DROP INDEX IF EXISTS "clinical_attention_versions_clinic_attention_version_idx";
