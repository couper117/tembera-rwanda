-- Key-value storage for application and admin configuration, currently the
-- travel assistant's settings (/admin/chatbot).
--
-- This table reached the dev branch through `prisma db push`, so it existed in
-- the database with no migration behind it. Dev worked and production would
-- not have: `migrate deploy` only replays this directory, so the chatbot
-- config screen would have failed there against a table that was never
-- created. Written by hand and marked applied with `migrate resolve`, because
-- the alternative Prisma offers for drift is resetting the database — and the
-- dev branch holds the entire catalogue.
CREATE TABLE "system_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key")
);
