-- AlterTable
ALTER TABLE "ProjectImage" ADD COLUMN     "originalBlurDataUrl" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "originalFileKey" TEXT,
ADD COLUMN     "originalHeight" INTEGER,
ADD COLUMN     "originalWidth" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "ProjectImage_originalFileKey_key" ON "ProjectImage"("originalFileKey");

