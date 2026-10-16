-- CreateEnum
CREATE TYPE "ClinicalAttentionStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "clinical_attentions" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "clinical_history_id" TEXT NOT NULL,
    "attended_by_user_id" TEXT NOT NULL,
    "status" "ClinicalAttentionStatus" NOT NULL DEFAULT 'OPEN',
    "procedures_performed" JSONB NOT NULL,
    "evolution_notes" TEXT NOT NULL,
    "prescription" TEXT,
    "post_operative_indications" TEXT,
    "private_notes" TEXT,
    "attended_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_attentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attention_materials_used" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "attention_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "tooth_number" TEXT,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attention_materials_used_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clinical_attentions_clinic_id_patient_id_attended_at_idx" ON "clinical_attentions"("clinic_id", "patient_id", "attended_at");

-- CreateIndex
CREATE INDEX "clinical_attentions_clinic_id_clinical_history_id_idx" ON "clinical_attentions"("clinic_id", "clinical_history_id");

-- CreateIndex
CREATE INDEX "attention_materials_used_clinic_id_attention_id_idx" ON "attention_materials_used"("clinic_id", "attention_id");

-- CreateIndex
CREATE INDEX "attention_materials_used_clinic_id_material_id_idx" ON "attention_materials_used"("clinic_id", "material_id");

-- AddForeignKey
ALTER TABLE "clinical_attentions" ADD CONSTRAINT "clinical_attentions_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_attentions" ADD CONSTRAINT "clinical_attentions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_attentions" ADD CONSTRAINT "clinical_attentions_clinical_history_id_fkey" FOREIGN KEY ("clinical_history_id") REFERENCES "clinical_histories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_attentions" ADD CONSTRAINT "clinical_attentions_attended_by_user_id_fkey" FOREIGN KEY ("attended_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attention_materials_used" ADD CONSTRAINT "attention_materials_used_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attention_materials_used" ADD CONSTRAINT "attention_materials_used_attention_id_fkey" FOREIGN KEY ("attention_id") REFERENCES "clinical_attentions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attention_materials_used" ADD CONSTRAINT "attention_materials_used_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
