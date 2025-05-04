/*
  Warnings:

  - You are about to drop the column `requestFromId` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `requestType` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `requesterId` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `decimals` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `receiverId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `requestFromAddress` to the `requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requesterAddress` to the `requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverAddress` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderAddress` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Type" AS ENUM ('Send', 'Request');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_requestFromId_fkey";

-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_requesterId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_receiverId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_senderId_fkey";

-- AlterTable
ALTER TABLE "requests" DROP COLUMN "requestFromId",
DROP COLUMN "requestType",
DROP COLUMN "requesterId",
ADD COLUMN     "requestFromAddress" TEXT NOT NULL,
ADD COLUMN     "requesterAddress" TEXT NOT NULL,
ADD COLUMN     "type" "Type" NOT NULL;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "decimals",
DROP COLUMN "receiverId",
DROP COLUMN "senderId",
ADD COLUMN     "receiverAddress" TEXT NOT NULL,
ADD COLUMN     "senderAddress" TEXT NOT NULL,
ADD COLUMN     "transactionStatus" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "type" "Type" NOT NULL;

-- DropEnum
DROP TYPE "RequestType";

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_senderAddress_fkey" FOREIGN KEY ("senderAddress") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_receiverAddress_fkey" FOREIGN KEY ("receiverAddress") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_requesterAddress_fkey" FOREIGN KEY ("requesterAddress") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_requestFromAddress_fkey" FOREIGN KEY ("requestFromAddress") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
