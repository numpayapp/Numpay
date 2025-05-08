/*
  Warnings:

  - The values [PAYMENT,REFUND] on the enum `RequestType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `requestToId` on the `requests` table. All the data in the column will be lost.
  - Added the required column `payerId` to the `requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RequestType_new" AS ENUM ('GLOBAL', 'DIRECT', 'OTHER');
ALTER TABLE "requests" ALTER COLUMN "requestType" TYPE "RequestType_new" USING ("requestType"::text::"RequestType_new");
ALTER TYPE "RequestType" RENAME TO "RequestType_old";
ALTER TYPE "RequestType_new" RENAME TO "RequestType";
DROP TYPE "RequestType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_requestToId_fkey";

-- AlterTable
ALTER TABLE "requests" DROP COLUMN "requestToId",
ADD COLUMN     "payerId" TEXT NOT NULL,
ADD COLUMN     "payerPhone" TEXT,
ADD COLUMN     "requestMessage" TEXT;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
