-- CreateTable
CREATE TABLE "clinical_attention_versions" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "attention_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "previous_data" JSONB NOT NULL,
    "change_reason" TEXT NOT NULL,
    "amended_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_attention_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clinical_attention_versions_clinic_attention_version_key" ON "clinical_attention_versions"("clinic_id", "attention_id", "version_number");

-- CreateIndex
CREATE INDEX "clinical_attention_versions_clinic_attention_version_idx" ON "clinical_attention_versions"("clinic_id", "attention_id", "version_number");

-- AddForeignKey
ALTER TABLE "clinical_attention_versions" ADD CONSTRAINT "clinical_attention_versions_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_attention_versions" ADD CONSTRAINT "clinical_attention_versions_attention_id_fkey" FOREIGN KEY ("attention_id") REFERENCES "clinical_attentions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_attention_versions" ADD CONSTRAINT "clinical_attention_versions_amended_by_user_id_fkey" FOREIGN KEY ("amended_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
