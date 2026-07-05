ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeCustomerId" varchar(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" varchar(255);
