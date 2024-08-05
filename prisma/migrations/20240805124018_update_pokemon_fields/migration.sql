/*
  Warnings:

  - You are about to drop the column `type` on the `Pokemon` table. All the data in the column will be lost.
  - Added the required column `abilities` to the `Pokemon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cries` to the `Pokemon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `species` to the `Pokemon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sprites` to the `Pokemon` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weight` to the `Pokemon` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pokemon" DROP COLUMN "type",
ADD COLUMN     "abilities" JSONB NOT NULL,
ADD COLUMN     "cries" JSONB NOT NULL,
ADD COLUMN     "species" JSONB NOT NULL,
ADD COLUMN     "sprites" JSONB NOT NULL,
ADD COLUMN     "weight" INTEGER NOT NULL;
