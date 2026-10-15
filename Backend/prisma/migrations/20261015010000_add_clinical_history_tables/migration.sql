-- CreateEnum
CREATE TYPE "TreatmentItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "clinical_histories" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "chief_complaint" TEXT NOT NULL,
    "current_illness" TEXT NOT NULL,
    "personal_antecedents" JSONB NOT NULL,
    "family_antecedents" TEXT,
    "clinical_examination" TEXT,
    "diagnoses" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_histories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatment_plan_items" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "clinical_history_id" TEXT NOT NULL,
    "procedure_id" TEXT NOT NULL,
    "procedure_code" TEXT NOT NULL,
    "procedure_name" TEXT NOT NULL,
    "tooth_number" TEXT,
    "status" "TreatmentItemStatus" NOT NULL DEFAULT 'PENDING',
    "estimated_cost_cop" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatment_plan_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clinical_histories_clinic_id_patient_id_key" ON "clinical_histories"("clinic_id", "patient_id");

-- CreateIndex
CREATE INDEX "clinical_histories_clinic_id_patient_id_idx" ON "clinical_histories"("clinic_id", "patient_id");

-- CreateIndex
CREATE INDEX "treatment_plan_items_clinic_id_clinical_history_id_idx" ON "treatment_plan_items"("clinic_id", "clinical_history_id");

-- AddForeignKey
ALTER TABLE "clinical_histories" ADD CONSTRAINT "clinical_histories_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_histories" ADD CONSTRAINT "clinical_histories_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plan_items" ADD CONSTRAINT "treatment_plan_items_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plan_items" ADD CONSTRAINT "treatment_plan_items_clinical_history_id_fkey" FOREIGN KEY ("clinical_history_id") REFERENCES "clinical_histories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatment_plan_items" ADD CONSTRAINT "treatment_plan_items_procedure_id_fkey" FOREIGN KEY ("procedure_id") REFERENCES "procedures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
