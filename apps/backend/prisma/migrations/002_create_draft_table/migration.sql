CREATE TABLE IF NOT EXISTS "Draft" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Draft_pkey" PRIMARY KEY ("id"),

    CONSTRAINT "Draft_emailId_fkey"
    FOREIGN KEY ("emailId")
    REFERENCES "Email"("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Draft_emailId_key"
ON "Draft"("emailId");