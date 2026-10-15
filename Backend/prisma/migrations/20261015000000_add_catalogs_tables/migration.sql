-- CreateTable
CREATE TABLE "procedures" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "base_price_cop" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procedures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_procedure_prices" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "procedure_id" TEXT NOT NULL,
    "custom_price_cop" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_procedure_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "current_stock" INTEGER NOT NULL,
    "min_stock" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "procedures_clinic_id_code_key" ON "procedures"("clinic_id", "code");

-- CreateIndex
CREATE INDEX "procedures_clinic_id_is_active_idx" ON "procedures"("clinic_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "patient_procedure_prices_clinic_id_patient_id_procedure_id_key" ON "patient_procedure_prices"("clinic_id", "patient_id", "procedure_id");

-- CreateIndex
CREATE INDEX "patient_procedure_prices_clinic_id_patient_id_idx" ON "patient_procedure_prices"("clinic_id", "patient_id");

-- CreateIndex
CREATE UNIQUE INDEX "materials_clinic_id_brand_reference_color_key" ON "materials"("clinic_id", "brand", "reference", "color");

-- CreateIndex
CREATE INDEX "materials_clinic_id_is_active_idx" ON "materials"("clinic_id", "is_active");

-- AddForeignKey
ALTER TABLE "procedures" ADD CONSTRAINT "procedures_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_procedure_prices" ADD CONSTRAINT "patient_procedure_prices_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_procedure_prices" ADD CONSTRAINT "patient_procedure_prices_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_procedure_prices" ADD CONSTRAINT "patient_procedure_prices_procedure_id_fkey" FOREIGN KEY ("procedure_id") REFERENCES "procedures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
