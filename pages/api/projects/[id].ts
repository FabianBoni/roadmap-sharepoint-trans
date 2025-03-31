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
  const { id } = req.query
  
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' })
  }
  
  // GET - Fetch a single project
  if (req.method === 'GET') {
    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          teamMembers: true,
          fields: true,
        },
      })
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' })
      }
      
      // Group fields by type
      const processFields = project.fields
        .filter((field: { type: string }) => field.type === 'PROCESS')
        .map((f: { value: string }) => f.value)
        
      const technologyFields = project.fields
        .filter((field: { type: string }) => field.type === 'TECHNOLOGY')
        .map((f: { value: string }) => f.value)
        
      const serviceFields = project.fields
        .filter((field: { type: string }) => field.type === 'SERVICE')
        .map((f: { value: string }) => f.value)
        
      const dataFields = project.fields
        .filter((field: { type: string }) => field.type === 'DATA')
        .map((f: { value: string }) => f.value)
      
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
      
      const formattedProject = {
        id: project.id,
        title: project.title,
        category: project.category,
        startQuarter: project.startQuarter,
        endQuarter: project.endQuarter,
        description: project.description,
        status,
        users: project.teamMembers.map((member: { name: any; role: any; imageUrl: any }) => ({
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
      
      res.status(200).json(formattedProject)
    } catch (error) {
      console.error('Error fetching project:', error)
      res.status(500).json({ error: 'Failed to fetch project' })
    }
  } 
  // PUT - Update a project
  else if (req.method === 'PUT') {
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

      // First, delete existing team members and fields
      await prisma.teamMember.deleteMany({
        where: { projectId: id },
      })
      
      await prisma.field.deleteMany({
        where: { projectId: id },
      })

      // Then update the project with new data
      const updatedProject = await prisma.project.update({
        where: { id },
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
          // Create new team members
          teamMembers: {
            create: teamMembers.map((member: { name: string; role: string }) => ({
              name: member.name,
              role: member.role,
            })),
          },
          // Create new fields
          fields: {
            create: [
              ...fields.process.map((value: string) => ({ type: 'PROCESS', value })),
              ...fields.technology.map((value: string) => ({ type: 'TECHNOLOGY', value })),
              ...fields.services.map((value: string) => ({ type: 'SERVICE', value })),
              ...fields.data.map((value: string) => ({ type: 'DATA', value })),
            ],
          },
        },
        include: {
          teamMembers: true,
          fields: true,
        },
      })

      res.status(200).json(updatedProject)
    } catch (error) {
      console.error('Error updating project:', error)
      res.status(500).json({ error: 'Failed to update project' })
    }
  }
  // DELETE - Delete a project
  else if (req.method === 'DELETE') {
    try {
      // Delete the project (cascade delete will handle related records)
      await prisma.project.delete({
        where: { id },
      })
      
      res.status(200).json({ success: true, message: 'Project deleted successfully' })
    } catch (error) {
      console.error('Error deleting project:', error)
      res.status(500).json({ error: 'Failed to delete project' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}