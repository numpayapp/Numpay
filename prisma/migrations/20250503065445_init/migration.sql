/*
  Warnings:

  - You are about to drop the column `requestFromAddress` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `requesterAddress` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `requests` table. All the data in the column will be lost.
  - You are about to drop the column `amountSent` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `receiverAddress` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `senderAddress` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `requestToId` to the `requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requesterId` to the `requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amount` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receiverId` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderId` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionType` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SEND', 'REQUEST', 'RECEIVE', 'DEPOSIT');

-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_requestFromAddress_fkey";

-- DropForeignKey
ALTER TABLE "requests" DROP CONSTRAINT "requests_requesterAddress_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_receiverAddress_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_senderAddress_fkey";

-- AlterTable
ALTER TABLE "requests" DROP COLUMN "requestFromAddress",
DROP COLUMN "requesterAddress",
DROP COLUMN "type",
ADD COLUMN     "requestToId" TEXT NOT NULL,
ADD COLUMN     "requesterId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "amountSent",
DROP COLUMN "receiverAddress",
DROP COLUMN "senderAddress",
DROP COLUMN "type",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "receiverId" TEXT NOT NULL,
ADD COLUMN     "senderId" TEXT NOT NULL,
ADD COLUMN     "transactionType" "TransactionType" NOT NULL;

-- DropEnum
DROP TYPE "Type";

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_requestToId_fkey" FOREIGN KEY ("requestToId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
