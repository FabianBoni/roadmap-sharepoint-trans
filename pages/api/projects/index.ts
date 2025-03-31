import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

// Define the Status enum manually to match the schema
enum Status {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET - Fetch all projects
  if (req.method === 'GET') {
    try {
      const projects = await prisma.project.findMany({
        include: {
          teamMembers: true,
          fields: true,
        },
      })
      
      // Transform the data to match the expected format in the frontend
      const formattedProjects = projects.map((project: { fields: any[]; status: any; id: any; title: any; category: any; startQuarter: any; endQuarter: any; description: any; teamMembers: any[]; projektleitung: any; bisher: any; zukunft: any; fortschritt: any; geplante_umsetzung: any; budget: any }) => {
        // Group fields by type
        const processFields = project.fields.filter(field => field.type === 'PROCESS').map(f => f.value)
        const technologyFields = project.fields.filter(field => field.type === 'TECHNOLOGY').map(f => f.value)
        const serviceFields = project.fields.filter(field => field.type === 'SERVICE').map(f => f.value)
        const dataFields = project.fields.filter(field => field.type === 'DATA').map(f => f.value)
        
        // Map status from enum to string
        let status: 'planned' | 'in-progress' | 'completed'
        switch (project.status) {
          case 'PLANNED':
            status = 'planned'
            break
          case 'IN_PROGRESS':
            status = 'in-progress'
            break
          case 'COMPLETED':
            status = 'completed'
            break
          default:
            status = 'planned'
        }
        
        return {
          id: project.id,
          title: project.title,
          category: project.category,
          startQuarter: project.startQuarter,
          endQuarter: project.endQuarter,
          description: project.description,
          status,
          users: project.teamMembers.map(member => ({
            name: member.name,
            role: member.role,
            imageUrl: member.imageUrl || '',
          })),
          projektleitung: project.projektleitung,
          bisher: project.bisher,
          zukunft: project.zukunft,
          felder: {
            process: processFields,
            technology: technologyFields,
            services: serviceFields,
            data: dataFields,
          },
          fortschritt: project.fortschritt,
          geplante_umsetzung: project.geplante_umsetzung,
          budget: project.budget,
        }
      })
      
      res.status(200).json(formattedProjects)
    } catch (error) {
      console.error('Error fetching projects:', error)
      res.status(500).json({ error: 'Failed to fetch projects' })
    }
  } 
  // POST - Create a new project
  else if (req.method === 'POST') {
    try {
      const {
        title,
        category,
        startQuarter,
        endQuarter,
        description,
        status,
        projektleitung,
        bisher,
        zukunft,
        fortschritt,
        geplante_umsetzung,
        budget,
        teamMembers,
        fields,
      } = req.body

      // Map status string to enum
      let statusEnum: string
      switch (status) {
        case 'planned':
          statusEnum = 'PLANNED'
          break
        case 'in-progress':
          statusEnum = 'IN_PROGRESS'
          break
        case 'completed':
          statusEnum = 'COMPLETED'
          break
        default:
          statusEnum = 'PLANNED'
      }

      // Create the project with nested relations
      const project = await prisma.project.create({
        data: {
          title,
          category,
          startQuarter,
          endQuarter,
          description,
          status: statusEnum,
          projektleitung,
          bisher,
          zukunft,
          fortschritt,
          geplante_umsetzung,
          budget,
          // Create team members
          teamMembers: {
            create: teamMembers.map((member: { name: string; role: string }) => ({
              name: member.name,
              role: member.role,
            })),
          },
          // Create fields
          fields: {
            create: [
              ...fields.process.map((value: string) => ({ type: 'PROCESS', value })),
              ...fields.technology.map((value: string) => ({ type: 'TECHNOLOGY', value })),
              ...fields.services.map((value: string) => ({ type: 'SERVICE', value })),
              ...fields.data.map((value: string) => ({ type: 'DATA', value })),
            ],
          },
        },
      })

      res.status(201).json(project)
    } catch (error) {
      console.error('Error creating project:', error)
      res.status(500).json({ error: 'Failed to create project' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}