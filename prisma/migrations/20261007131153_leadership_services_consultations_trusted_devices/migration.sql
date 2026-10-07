-- CreateEnum
CREATE TYPE "ConsultationStatus" AS ENUM ('PENDING', 'CONTACTED', 'COMPLETED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "capabilityLayout" TEXT NOT NULL DEFAULT 'grid',
ADD COLUMN     "outcomes" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "visual" TEXT NOT NULL DEFAULT 'auto',
ADD COLUMN     "whyItMatters" JSONB;

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "department" JSONB,
ADD COLUMN     "expertise" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fullBio" JSONB,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "socials" JSONB NOT NULL DEFAULT '[]';

-- CreateTable
CREATE TABLE "TrustedDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultationRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT NOT NULL,
    "phoneCountry" TEXT NOT NULL,
    "phoneDialCode" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "country" TEXT,
    "serviceId" TEXT,
    "serviceTitle" TEXT,
    "preferredContact" TEXT NOT NULL DEFAULT 'email',
    "message" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "sourcePage" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "status" "ConsultationStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "contactedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsultationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrustedDevice_tokenHash_key" ON "TrustedDevice"("tokenHash");

-- CreateIndex
CREATE INDEX "TrustedDevice_userId_idx" ON "TrustedDevice"("userId");

-- CreateIndex
CREATE INDEX "ConsultationRequest_status_createdAt_idx" ON "ConsultationRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ConsultationRequest_email_idx" ON "ConsultationRequest"("email");

-- AddForeignKey
ALTER TABLE "TrustedDevice" ADD CONSTRAINT "TrustedDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
