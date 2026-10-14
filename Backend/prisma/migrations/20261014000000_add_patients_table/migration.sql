-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CC', 'TI', 'RC', 'CE', 'PAS', 'OTHER');

-- CreateEnum
CREATE TYPE "AcquisitionSource" AS ENUM ('REFERRAL', 'INSTAGRAM', 'WHATSAPP', 'DIRECT', 'OTHER');

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "document_number" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "acquisition_source" "AcquisitionSource" NOT NULL DEFAULT 'DIRECT',
    "data_treatment_consent" BOOLEAN NOT NULL,
    "data_treatment_consent_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_clinic_id_document_type_document_number_key" ON "patients"("clinic_id", "document_type", "document_number");

-- CreateIndex
CREATE INDEX "patients_clinic_id_is_active_idx" ON "patients"("clinic_id", "is_active");

-- CreateIndex
CREATE INDEX "patients_clinic_id_phone_idx" ON "patients"("clinic_id", "phone");

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
