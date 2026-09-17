-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('CONCEPT', 'PROJECT', 'SKILL', 'TECHNOLOGY', 'RESOURCE');

-- CreateEnum
CREATE TYPE "ConfidenceStatus" AS ENUM ('NEW', 'FAMILIAR', 'LEARNING', 'CONFIDENT', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('USES', 'DEPENDS_ON', 'PREREQUISITE_FOR', 'RELATED_TO', 'PART_OF', 'LEARNED_THROUGH', 'IMPLEMENTED_IN', 'SIMILAR_TO');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_nodes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "NodeType" NOT NULL,
    "status" "ConfidenceStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastReviewed" TIMESTAMP(3),

    CONSTRAINT "knowledge_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_relations" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "relationType" "RelationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_relations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "knowledge_nodes_userId_idx" ON "knowledge_nodes"("userId");

-- CreateIndex
CREATE INDEX "knowledge_nodes_userId_type_idx" ON "knowledge_nodes"("userId", "type");

-- CreateIndex
CREATE INDEX "knowledge_relations_sourceId_idx" ON "knowledge_relations"("sourceId");

-- CreateIndex
CREATE INDEX "knowledge_relations_targetId_idx" ON "knowledge_relations"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_relations_sourceId_targetId_relationType_key" ON "knowledge_relations"("sourceId", "targetId", "relationType");

-- AddForeignKey
ALTER TABLE "knowledge_nodes" ADD CONSTRAINT "knowledge_nodes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_relations" ADD CONSTRAINT "knowledge_relations_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "knowledge_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_relations" ADD CONSTRAINT "knowledge_relations_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "knowledge_nodes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
