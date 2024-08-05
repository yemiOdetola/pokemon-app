import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const organizations = await generateOrganizations(10);

  for (const org of organizations) {
    await generateUsers(org.id, 10);
  }

  console.log('Data organizations!', organizations);
}

async function generateOrganizations(count: number) {
  const organizations = [];

  for (let i = 1; i <= count; i++) {
    const name = `organization${i}`;
    const organization = await prisma.organization.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    organizations.push(organization);
    console.log(`Upserted organization: ${organization.name}`);
  }

  return organizations;
}

async function generateUsers(organizationId: number, count: number) {
  for (let i = 1; i <= count; i++) {
    const email = `user${i}@organization${organizationId}.com`;
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
      where: { email: email },
      update: {},
      create: {
        email: email,
        password: hashedPassword,
        organizationId: organizationId,
      },
    });
    console.log(
      `Upserted user: ${user.email} for organization ${organizationId}`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
