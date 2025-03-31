import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query
  
  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid field type ID' })
  }
  
  // GET - Fetch a single field type
  if (req.method === 'GET') {
    try {
      const fieldType = await prisma.fieldType.findUnique({
        where: { id }
      })
      
      if (!fieldType) {
        return res.status(404).json({ error: 'Field type not found' })
      }
      
      res.status(200).json(fieldType)
    } catch (error) {
      console.error('Error fetching field type:', error)
      res.status(500).json({ error: 'Failed to fetch field type' })
    }
  } 
  // PUT - Update a field type
  else if (req.method === 'PUT') {
    try {
      const { name, type, description } = req.body
      
      if (!name || !type || !description) {
        return res.status(400).json({ error: 'Name, type, and description are required' })
      }
      
      // Check if the type is being changed and if the new type already exists
      const existingFieldType = await prisma.fieldType.findUnique({
        where: { id }
      })
      
      if (!existingFieldType) {
        return res.status(404).json({ error: 'Field type not found' })
      }
      
      if (existingFieldType.type !== type) {
        const typeExists = await prisma.fieldType.findUnique({
          where: { type }
        })
        
        if (typeExists) {
          return res.status(400).json({ error: `Field type '${type}' already exists` })
        }
      }
      
      const updatedFieldType = await prisma.fieldType.update({
        where: { id },
        data: {
          name,
          type,
          description
        }
      })
      
      res.status(200).json(updatedFieldType)
    } catch (error) {
      console.error('Error updating field type:', error)
      res.status(500).json({ error: 'Failed to update field type' })
    }
  }
  // DELETE - Delete a field type
  else if (req.method === 'DELETE') {
    try {
      // Check if any fields are using this field type
      const fieldsUsingType = await prisma.field.findFirst({
        where: {
          type: {
            equals: (await prisma.fieldType.findUnique({ where: { id } }))?.type
          }
        }
      })
      
      if (fieldsUsingType) {
        return res.status(400).json({ 
          error: 'Cannot delete field type: it is being used by one or more projects' 
        })
      }
      
      await prisma.fieldType.delete({
        where: { id }
      })
      
      res.status(200).json({ success: true, message: 'Field type deleted successfully' })
    } catch (error) {
      console.error('Error deleting field type:', error)
      res.status(500).json({ error: 'Failed to delete field type' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}