-- AlterTable
ALTER TABLE "business_registrations" ADD COLUMN     "confirmed_via" TEXT,
ADD COLUMN     "payment_url" TEXT,
ADD COLUMN     "session_expires_at" TIMESTAMP(3),
ADD COLUMN     "session_id" TEXT;
