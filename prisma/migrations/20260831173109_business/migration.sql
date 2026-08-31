-- CreateEnum
CREATE TYPE "BusinessStatus" AS ENUM ('unverified', 'verified', 'suspended');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "SubmissionKind" AS ENUM ('create', 'edit');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "businesses" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "tin" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "status" "BusinessStatus" NOT NULL DEFAULT 'unverified',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_members" (
    "id" SERIAL NOT NULL,
    "business_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "owner" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_claims" (
    "id" SERIAL NOT NULL,
    "place_id" TEXT,
    "business_name" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'checked',
    "contact_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "status" "ClaimStatus" NOT NULL DEFAULT 'pending',
    "handled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submissions" (
    "id" SERIAL NOT NULL,
    "kind" "SubmissionKind" NOT NULL,
    "business_id" INTEGER NOT NULL,
    "submitted_by_user_id" INTEGER NOT NULL,
    "place_id" TEXT,
    "payload" JSONB NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'pending',
    "rejection_reason" TEXT NOT NULL DEFAULT '',
    "reviewed_by_user_id" INTEGER,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "businesses_status_idx" ON "businesses"("status");

-- CreateIndex
CREATE UNIQUE INDEX "business_members_user_id_key" ON "business_members"("user_id");

-- CreateIndex
CREATE INDEX "business_members_business_id_idx" ON "business_members"("business_id");

-- CreateIndex
CREATE INDEX "business_claims_status_idx" ON "business_claims"("status");

-- CreateIndex
CREATE INDEX "business_claims_place_id_idx" ON "business_claims"("place_id");

-- CreateIndex
CREATE INDEX "submissions_status_idx" ON "submissions"("status");

-- CreateIndex
CREATE INDEX "submissions_business_id_idx" ON "submissions"("business_id");

-- AddForeignKey
ALTER TABLE "places" ADD CONSTRAINT "places_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_members" ADD CONSTRAINT "business_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "business_claims" ADD CONSTRAINT "business_claims_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_submitted_by_user_id_fkey" FOREIGN KEY ("submitted_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
