-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('awaiting_payment', 'paid', 'active', 'rejected', 'expired');

-- CreateTable
CREATE TABLE "business_registrations" (
    "id" SERIAL NOT NULL,
    "business_name" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "amount_rwf" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'awaiting_payment',
    "payer_note" TEXT,
    "decided_at" TIMESTAMP(3),
    "decided_by_id" INTEGER,
    "business_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "business_registrations_reference_key" ON "business_registrations"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "business_registrations_business_id_key" ON "business_registrations"("business_id");

-- CreateIndex
CREATE INDEX "business_registrations_status_idx" ON "business_registrations"("status");

-- AddForeignKey
ALTER TABLE "business_registrations" ADD CONSTRAINT "business_registrations_decided_by_id_fkey" FOREIGN KEY ("decided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_registrations" ADD CONSTRAINT "business_registrations_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
