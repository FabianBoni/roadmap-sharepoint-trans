import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET - Fetch all field types
  if (req.method === 'GET') {
    try {
      const fieldTypes = await prisma.fieldType.findMany()
      res.status(200).json(fieldTypes)
    } catch (error) {
      console.error('Error fetching field types:', error)
      res.status(500).json({ error: 'Failed to fetch field types' })
    }
  } 
  // POST - Create a new field type
  else if (req.method === 'POST') {
    try {
      const { name, type, description } = req.body
      
      if (!name || !type || !description) {
        return res.status(400).json({ error: 'Name, type, and description are required' })
      }
      
      // Check if type already exists (must be unique)
      const existingType = await prisma.fieldType.findUnique({
        where: { type }
      })
      
      if (existingType) {
        return res.status(400).json({ error: `Field type '${type}' already exists` })
      }
      
      const newFieldType = await prisma.fieldType.create({
        data: {
          name,
          type,
          description
        }
      })
      
      res.status(201).json(newFieldType)
    } catch (error) {
      console.error('Error creating field type:', error)
      res.status(500).json({ error: 'Failed to create field type' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}