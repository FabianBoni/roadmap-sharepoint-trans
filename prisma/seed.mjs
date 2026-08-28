import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const sampleInstanceSlug = 'sample';
const testDeploymentSuperAdmin = 'fabian.boni@jsd.bs.ch';

const sampleFeedback = [
  {
    key: 'seed:sample:feedback-pdf-export',
    title: 'Roadmap als PDF exportieren',
    description:
      'Eine kompakte PDF-Ansicht soll sich für Sitzungen und den Versand an Stakeholder exportieren lassen.',
    status: 'OPEN',
    createdAt: new Date('2026-08-10T09:00:00.000Z'),
    completedAt: null,
    votes: [
      ['seed:sample:user:anna', 1],
      ['seed:sample:user:marco', 1],
      ['seed:sample:user:samira', 1],
    ],
  },
  {
    key: 'seed:sample:feedback-favorites',
    title: 'Favoriten und persönliche Ansichten',
    description:
      'Nutzerinnen und Nutzer möchten häufig verwendete Projekte markieren und als persönliche Ansicht speichern.',
    status: 'OPEN',
    createdAt: new Date('2026-08-14T13:30:00.000Z'),
    completedAt: null,
    votes: [
      ['seed:sample:user:anna', 1],
      ['seed:sample:user:marco', 1],
    ],
  },
  {
    key: 'seed:sample:feedback-excel-export',
    title: 'Direkter Excel-Export der Roadmap',
    description:
      'Die gefilterte Roadmap kann jetzt direkt als Excel-Datei heruntergeladen und weiterverarbeitet werden.',
    status: 'COMPLETED',
    createdAt: new Date('2026-07-28T08:15:00.000Z'),
    completedAt: new Date('2026-08-20T10:00:00.000Z'),
    votes: [
      ['seed:sample:user:anna', 1],
      ['seed:sample:user:marco', 1],
      ['seed:sample:user:samira', 1],
      ['seed:sample:user:noah', 1],
    ],
  },
];

const sampleSettings = {
  features: {
    sampleData: true,
  },
  metadata: {
    sampleData: true,
    seededBy: 'prisma/seed.mjs',
  },
};

async function seedSampleFeedback() {
  for (const sample of sampleFeedback) {
    const existing = await prisma.feedbackRequest.findFirst({
      where: { createdBy: sample.key },
      orderBy: { id: 'asc' },
    });
    const data = {
      title: sample.title,
      description: sample.description,
      createdBy: sample.key,
      createdByName: 'Roadmap Demo',
      status: sample.status,
      completedAt: sample.completedAt,
      completedBy: sample.completedAt ? testDeploymentSuperAdmin : null,
    };
    const feedback = existing
      ? await prisma.feedbackRequest.update({ where: { id: existing.id }, data })
      : await prisma.feedbackRequest.create({
          data: { ...data, createdAt: sample.createdAt },
        });

    for (const [userKey, value] of sample.votes) {
      await prisma.feedbackVote.upsert({
        where: { feedbackId_userKey: { feedbackId: feedback.id, userKey } },
        update: { value },
        create: { feedbackId: feedback.id, userKey, value },
      });
    }
  }
}

async function main() {
  await prisma.roadmapInstance.upsert({
    where: { slug: sampleInstanceSlug },
    update: {
      displayName: 'Sample Roadmap',
      description: 'Lokale Demo-Instanz mit Beispielprojekten für das Testdeployment.',
      sharePointSiteUrlDev: 'https://example.invalid/sites/roadmap-sample',
      sharePointSiteUrlProd: 'https://example.invalid/sites/roadmap-sample',
      sharePointStrategy: 'kerberos',
      allowSelfSigned: false,
      deploymentEnv: 'development',
      defaultLocale: 'de-CH',
      defaultTimeZone: 'Europe/Zurich',
      landingPage: 'sample',
      settingsJson: JSON.stringify(sampleSettings),
    },
    create: {
      slug: sampleInstanceSlug,
      displayName: 'Sample Roadmap',
      description: 'Lokale Demo-Instanz mit Beispielprojekten für das Testdeployment.',
      sharePointSiteUrlDev: 'https://example.invalid/sites/roadmap-sample',
      sharePointSiteUrlProd: 'https://example.invalid/sites/roadmap-sample',
      sharePointStrategy: 'kerberos',
      allowSelfSigned: false,
      deploymentEnv: 'development',
      defaultLocale: 'de-CH',
      defaultTimeZone: 'Europe/Zurich',
      landingPage: 'sample',
      settingsJson: JSON.stringify(sampleSettings),
    },
  });

  await prisma.superAdmin.upsert({
    where: { normalizedUsername: testDeploymentSuperAdmin },
    update: {
      username: testDeploymentSuperAdmin,
      normalizedUsername: testDeploymentSuperAdmin,
      isActive: true,
      note: 'Test deployment seed default',
    },
    create: {
      username: testDeploymentSuperAdmin,
      normalizedUsername: testDeploymentSuperAdmin,
      isActive: true,
      note: 'Test deployment seed default',
    },
  });

  await seedSampleFeedback();

  console.log(`Seeded sample roadmap instance: ${sampleInstanceSlug}`);
  console.log(`Seeded test deployment superadmin: ${testDeploymentSuperAdmin}`);
  console.log(`Seeded sample feedback: ${sampleFeedback.length} entries`);
}

main()
  .catch((error) => {
    console.error('Prisma seed failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
