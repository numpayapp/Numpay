/*
  Warnings:

  - You are about to drop the column `txid` on the `transactions` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[txhash]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[privyDID]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `txhash` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `privyDID` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "transactions_txid_key";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "txid",
ADD COLUMN     "txhash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "privyDID" TEXT NOT NULL,
ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_txhash_key" ON "transactions"("txhash");

-- CreateIndex
CREATE UNIQUE INDEX "users_privyDID_key" ON "users"("privyDID");
