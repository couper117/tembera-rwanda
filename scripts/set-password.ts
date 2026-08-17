/**
 * Reset a user's password from the command line.
 *
 *   npm run set-password -- admin@tembera.rw
 *   npm run set-password -- admin@tembera.rw "a-password-you-chose"
 *
 * With no password argument one is generated and printed. The password is
 * never echoed back to a log file — it goes to stdout once and that is all.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

const MIN_LENGTH = 12;

async function main() {
  const [email, supplied] = process.argv.slice(2);

  if (!email) {
    console.error("Usage: npm run set-password -- <email> [password]");
    process.exit(1);
  }

  if (supplied && supplied.length < MIN_LENGTH) {
    console.error(`Password must be at least ${MIN_LENGTH} characters.`);
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user) {
    console.error(`No account found for ${email}.`);
    process.exit(1);
  }

  const password = supplied ?? crypto.randomBytes(12).toString("base64url");

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });

  console.log(`\n  Password updated for ${user.name} <${user.email}> (${user.role})`);
  if (!supplied) {
    console.log(`  New password: ${password}`);
    console.log("  Shown once — save it now.\n");
  } else {
    console.log("");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
