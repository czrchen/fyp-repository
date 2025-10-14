-- CreateTable
CREATE TABLE "SellerChatbot" (
    "id" SERIAL NOT NULL,
    "sellerId" TEXT NOT NULL,
    "faqs" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SellerChatbot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SellerChatbot_sellerId_key" ON "SellerChatbot"("sellerId");
