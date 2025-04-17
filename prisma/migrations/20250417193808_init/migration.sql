/*
  Warnings:

  - You are about to drop the `Request` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('PAYMENT', 'REFUND', 'OTHER');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELED');

-- DropForeignKey
ALTER TABLE "Request" DROP CONSTRAINT "Request_requestFromUuid_fkey";

-- DropForeignKey
ALTER TABLE "Request" DROP CONSTRAINT "Request_requesterUuid_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_receiverUuid_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_senderUuid_fkey";

-- DropTable
DROP TABLE "Request";

-- DropTable
DROP TABLE "Transaction";

-- DropTable
DROP TABLE "UserProfile";

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "txid" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "amountSent" DOUBLE PRECISION NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 6,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requests" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "requestType" "RequestType" NOT NULL,
    "requestFromId" TEXT NOT NULL,
    "amountRequested" DOUBLE PRECISION NOT NULL,
    "requestStatus" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phoneNumber_key" ON "users"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_walletAddress_key" ON "users"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_txid_key" ON "transactions"("txid");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_requestFromId_fkey" FOREIGN KEY ("requestFromId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
