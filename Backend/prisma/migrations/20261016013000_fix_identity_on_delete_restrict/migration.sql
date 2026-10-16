-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_clinic_id_fkey";
ALTER TABLE "refresh_sessions" DROP CONSTRAINT IF EXISTS "refresh_sessions_clinic_id_fkey";
ALTER TABLE "refresh_sessions" DROP CONSTRAINT IF EXISTS "refresh_sessions_user_id_fkey";

-- AddForeignKey with ON DELETE RESTRICT (RC-055)
ALTER TABLE "users" ADD CONSTRAINT "users_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "refresh_sessions" ADD CONSTRAINT "refresh_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
