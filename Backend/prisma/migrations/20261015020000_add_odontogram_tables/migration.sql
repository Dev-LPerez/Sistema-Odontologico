-- CreateTable
CREATE TABLE "odontograms" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "has_temporal_dentition" BOOLEAN NOT NULL DEFAULT false,
    "teeth_state" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "odontograms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "odontogram_snapshots" (
    "id" TEXT NOT NULL,
    "clinic_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "odontogram_id" TEXT NOT NULL,
    "has_temporal_dentition" BOOLEAN NOT NULL,
    "snapshot_data" JSONB NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "odontogram_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "odontograms_clinic_id_patient_id_key" ON "odontograms"("clinic_id", "patient_id");

-- CreateIndex
CREATE INDEX "odontograms_clinic_id_patient_id_idx" ON "odontograms"("clinic_id", "patient_id");

-- CreateIndex
CREATE INDEX "odontogram_snapshots_clinic_id_patient_id_created_at_idx" ON "odontogram_snapshots"("clinic_id", "patient_id", "created_at");

-- AddForeignKey
ALTER TABLE "odontograms" ADD CONSTRAINT "odontograms_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odontograms" ADD CONSTRAINT "odontograms_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odontogram_snapshots" ADD CONSTRAINT "odontogram_snapshots_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odontogram_snapshots" ADD CONSTRAINT "odontogram_snapshots_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "odontogram_snapshots" ADD CONSTRAINT "odontogram_snapshots_odontogram_id_fkey" FOREIGN KEY ("odontogram_id") REFERENCES "odontograms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
