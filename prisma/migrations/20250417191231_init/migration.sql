-- CreateTable
CREATE TABLE "UserProfile" (
    "uuid" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("uuid")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "txid" TEXT NOT NULL,
    "senderUuid" TEXT NOT NULL,
    "receiverUuid" TEXT NOT NULL,
    "amountSent" DOUBLE PRECISION NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 6,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("txid")
);

-- CreateTable
CREATE TABLE "Request" (
    "requestId" TEXT NOT NULL,
    "requesterUuid" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "requestFromUuid" TEXT NOT NULL,
    "amountRequested" DOUBLE PRECISION NOT NULL,
    "requestStatus" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("requestId")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_phoneNumber_key" ON "UserProfile"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_walletAddress_key" ON "UserProfile"("walletAddress");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_senderUuid_fkey" FOREIGN KEY ("senderUuid") REFERENCES "UserProfile"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_receiverUuid_fkey" FOREIGN KEY ("receiverUuid") REFERENCES "UserProfile"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_requesterUuid_fkey" FOREIGN KEY ("requesterUuid") REFERENCES "UserProfile"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_requestFromUuid_fkey" FOREIGN KEY ("requestFromUuid") REFERENCES "UserProfile"("uuid") ON DELETE RESTRICT ON UPDATE CASCADE;
