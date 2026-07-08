/**
 * Promote a user to the "admin" role so they can reach /admin/*.
 *
 * New accounts are created with role "user" (schema default + Better Auth
 * default), and there is no in-app way to grant admin — so run this once
 * after signing up:
 *
 *   bun run make:admin you@example.com
 *
 * (Bun auto-loads .env, so DATABASE_URL is picked up automatically.)
 */
import { prisma } from "@/lib/prisma";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: bun run make:admin <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email "${email}". Sign up first, then rerun.`);
    process.exit(1);
  }

  if (user.role === "admin") {
    console.log(`${email} is already an admin.`);
    return;
  }

  await prisma.user.update({ where: { email }, data: { role: "admin" } });
  console.log(`Promoted ${email} to admin. Sign out and back in to refresh the session.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
