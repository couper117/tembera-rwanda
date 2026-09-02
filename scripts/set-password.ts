// Create or re-password a staff account from the command line.
//
// This is deliberately the ONLY way an ADMIN comes into existence. The seed
// does not create one: a seeded admin means a password living in an
// environment variable or, worse, a default that survives into production
// because nothing forces anyone to change it.
//
//   npm run set-password -- admin@tembera.rw                 # generate one
//   npm run set-password -- admin@tembera.rw "chosen-pass"   # or choose it
//   npm run set-password -- editor@tembera.rw --role EDITOR
//
// An existing account keeps its role unless --role is given. A new one is
// created as ADMIN unless told otherwise.
import "dotenv/config";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient, type Role } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) throw new Error("Set DIRECT_URL (or DATABASE_URL).");

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

const MIN_LENGTH = 12;
const VALID_ROLES: Role[] = ["USER", "BUSINESS", "EDITOR", "ADMIN"];

function slugifyHandle(email: string): string {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 24) || "staff";
}

async function uniqueHandle(base: string): Promise<string> {
  for (let n = 1; ; n++) {
    const candidate = n === 1 ? base : `${base}${n}`;
    const taken = await prisma.user.findUnique({
      where: { handle: candidate },
      select: { handle: true },
    });
    if (!taken) return candidate;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const roleIndex = args.indexOf("--role");
  const role = roleIndex === -1 ? undefined : (args[roleIndex + 1] as Role);
  if (roleIndex !== -1 && !VALID_ROLES.includes(role as Role)) {
    throw new Error(`--role must be one of ${VALID_ROLES.join(", ")}.`);
  }
  // Guard the -1 case explicitly. `i !== roleIndex + 1` reads harmlessly but
  // becomes `i !== 0` when --role is absent, which silently swallows the email
  // and shifts the password into its place — creating an account named after
  // the password, with the default ADMIN role.
  const positional =
    roleIndex === -1
      ? args
      : args.filter((_, i) => i !== roleIndex && i !== roleIndex + 1);

  const email = positional[0]?.trim().toLowerCase();
  if (!email) {
    throw new Error('Usage: npm run set-password -- <email> [password] [--role ADMIN]');
  }

  const supplied = positional[1];
  if (supplied && supplied.length < MIN_LENGTH) {
    throw new Error(`Password must be at least ${MIN_LENGTH} characters.`);
  }
  // Generated rather than defaulted: every install differs, and the operator
  // has to read it from this output, so it cannot be quietly left as-is.
  const password = supplied ?? crypto.randomBytes(12).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        ...(role ? { role } : {}),
        // Every token already issued for this account carried the old version,
        // so bumping it signs out every other device — which is the point of
        // resetting a password.
        tokenVersion: { increment: 1 },
      },
    });
    console.log(`Updated ${email} (${role ?? existing.role}). Other sessions signed out.`);
  } else {
    await prisma.user.create({
      data: {
        email,
        name: email.split("@")[0],
        handle: await uniqueHandle(slugifyHandle(email)),
        passwordHash,
        role: role ?? "ADMIN",
        homeCity: "Kigali",
      },
    });
    console.log(`Created ${email} as ${role ?? "ADMIN"}.`);
  }

  if (!supplied) {
    console.log(
      [
        "",
        "  ┌──────────────────────────────────────────────┐",
        "  │  Password, shown once. Save it now.          │",
        "  └──────────────────────────────────────────────┘",
        "",
        `  ${password}`,
        "",
      ].join("\n"),
    );
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
