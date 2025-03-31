import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

// Define the enums manually to match the schema
enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

enum Status {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jsd.bs.ch' },
    update: {},
    create: {
      email: 'admin@jsd.bs.ch',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN', // Use string instead of enum
    },
  })
  
  console.log({ admin })
  
  // Create field types
  const fieldTypes = await Promise.all([
    prisma.fieldType.upsert({
      where: { type: 'PROCESS' },
      update: {},
      create: {
        name: 'Process',
        type: 'PROCESS',
        description: 'Process steps and workflows'
      },
    }),
    prisma.fieldType.upsert({
      where: { type: 'TECHNOLOGY' },
      update: {},
      create: {
        name: 'Technology',
        type: 'TECHNOLOGY',
        description: 'Technologies and tools used'
      },
    }),
    prisma.fieldType.upsert({
      where: { type: 'SERVICE' },
      update: {},
      create: {
        name: 'Service',
        type: 'SERVICE',
        description: 'Services provided or utilized'
      },
    }),
    prisma.fieldType.upsert({
      where: { type: 'DATA' },
      update: {},
      create: {
        name: 'Data',
        type: 'DATA',
        description: 'Data types and sources'
      },
    }),
  ])
  
  console.log({ fieldTypes })
  
  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'cat1' },
      update: {},
      create: {
        id: 'cat1',
        name: 'Digital Workplace',
        color: '#4299E1', // blue-500
        icon: 'ComputerIcon',
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat2' },
      update: {},
      create: {
        id: 'cat2',
        name: 'Infrastructure',
        color: '#48BB78', // green-500
        icon: 'ServerIcon',
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat3' },
      update: {},
      create: {
        id: 'cat3',
        name: 'Security',
        color: '#ED8936', // orange-500
        icon: 'ShieldIcon',
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat4' },
      update: {},
      create: {
        id: 'cat4',
        name: 'Digitalisierung',
        color: '#805AD5', // purple-500
        icon: 'DeviceTabletIcon',
      },
    }),
  ])
  
  console.log({ categories })
  
  // Create new projects as per the requirements
  
  // 1. KanBo Project
  const kanboProject = await prisma.project.upsert({
    where: { id: 'kanbo' },
    update: {},
    create: {
      id: 'kanbo',
      title: 'KanBo',
      category: 'cat4', // Digitalisierung
      startQuarter: 'Q1',
      endQuarter: 'Q4',
      description: 'Einführung und Implementierung von KanBo als einheitliches Projektmanagement-Tool im JSD.',
      status: 'IN_PROGRESS',
      projektleitung: 'Majlinda Maliqi',
      bisher: 'Das Projektmanagement erfolgte bisher auf Basis individueller Eigenverantwortung, ohne einheitliche Tools oder Vorgehensweisen. Die Dokumentation und Planung wurden überwiegend in Excel oder anderen dezentralen Lösungen durchgeführt. Obwohl KanBo als Basisdienstleistung von IT BS zur Verfügung steht, wurde es bislang nicht konsequent genutzt.',
      zukunft: 'Ziel ist es, KanBo in den verschiedenen Abteilungen des JSD gezielt zu implementieren, um eine einheitliche Arbeitsweise in Projekten zu gewährleisten und ein gemeinsames Verständnis zu schaffen.',
      fortschritt: 40,
      geplante_umsetzung: 'Fortlaufend ab Q1 2025',
      budget: '€50.000',
    },
  })
  
  // Add fields for KanBo project
  await prisma.field.create({
    data: {
      type: 'PROCESS',
      value: 'Kompetenzen',
      projectId: kanboProject.id,
    },
  })
  
  await prisma.field.create({
    data: {
      type: 'SERVICE',
      value: 'Übergreifend über alle Abteilungen',
      projectId: kanboProject.id,
    },
  })
  
  // 2. Roadmap Project
  const roadmapProject = await prisma.project.upsert({
    where: { id: 'roadmap' },
    update: {},
    create: {
      id: 'roadmap',
      title: 'Roadmap',
      category: 'cat4', // Digitalisierung
      startQuarter: 'Q1',
      endQuarter: 'Q2',
      description: 'Entwicklung einer interaktiven Projekt-Roadmap auf dem internen SharePoint.',
      status: 'IN_PROGRESS',
      projektleitung: 'Fabian Boni und Jens Mirwald',
      bisher: 'In der IT JSD werden diverse Projekte initiiert und umgesetzt, darunter Digitalisierungs- und sonstige Projekte. Aufgrund der hohen Auslastung bleibt die Dokumentation oft unvollständig, sodass nicht immer ersichtlich ist, welche Projekte aktuell laufen oder bereits abgeschlossen wurden.',
      zukunft: 'Eine interaktive Roadmap auf dem internen SharePoint bietet eine zentrale und transparente Übersicht über alle laufenden und geplanten Projekte. Sie zeigt den aktuellen Fortschritt, die verantwortlichen Ansprechpersonen, die übergeordneten Ziele sowie die geplante Umsetzung. Dadurch wird sichergestellt, dass alle Beteiligten jederzeit den Status der Projekte einsehen können, Doppelspurigkeiten vermieden werden und eine effizientere Koordination zwischen den Abteilungen möglich ist.',
      fortschritt: 80,
      geplante_umsetzung: 'Q2 2025',
      budget: '€30.000',
    },
  })
  
  // Add fields for Roadmap project
  await prisma.field.create({
    data: {
      type: 'PROCESS',
      value: 'Prozesse',
      projectId: roadmapProject.id,
    },
  })
  
  await prisma.field.create({
    data: {
      type: 'SERVICE',
      value: 'GS',
      projectId: roadmapProject.id,
    },
  })
  
  // 3. Kompass 2.0 Project
  const kompassProject = await prisma.project.upsert({
    where: { id: 'kompass' },
    update: {},
    create: {
      id: 'kompass',
      title: 'Kompass 2.0',
      category: 'cat4', // Digitalisierung
      startQuarter: 'Q1',
      endQuarter: 'Q2',
      description: 'Entwicklung einer zentralen Übersicht über IT-Programme und deren Verantwortliche im JSD.',
      status: 'IN_PROGRESS',
      projektleitung: 'Fabian Boni',
      bisher: 'Im JSD gibt es keine zentrale Übersicht über die bestehenden IT-Programme und deren Verantwortliche. Dadurch war oft unklar, welche Softwarelösungen im Einsatz sind, in welchen Bereichen sie genutzt werden und wer als Ansprechperson dient. Dies führte zu ineffizienten Prozessen und erschwerte die Zusammenarbeit.',
      zukunft: 'Kompass 2.0 schafft Transparenz, indem es eine strukturierte Übersicht über alle aktiven Programme im JSD bietet. Die Plattform zeigt, welche Softwarelösungen in den jeweiligen Bereichen genutzt werden und wer für deren Verwaltung und Support zuständig ist. Dies erleichtert die Koordination, verbessert die Effizienz und sorgt für eine bessere Nachvollziehbarkeit.',
      fortschritt: 90,
      geplante_umsetzung: 'Q2 2025',
      budget: '€40.000',
    },
  })
  
  // Add fields for Kompass 2.0 project
  await prisma.field.create({
    data: {
      type: 'PROCESS',
      value: 'Prozesse',
      projectId: kompassProject.id,
    },
  })
  
  await prisma.field.create({
    data: {
      type: 'SERVICE',
      value: 'Übergreifend über alle Abteilungen',
      projectId: kompassProject.id,
    },
  })
  
  console.log({ kanboProject, roadmapProject, kompassProject })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })