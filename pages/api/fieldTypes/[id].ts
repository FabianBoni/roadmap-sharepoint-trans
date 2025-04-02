import { NextApiRequest, NextApiResponse } from 'next'
import { clientDataService } from '@/utils/clientDataService';

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
      // Use clientDataService directly
      const fieldType = await clientDataService.getFieldTypeById(id);
      
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
      
      // Use clientDataService directly
      await clientDataService.updateFieldType(id, { name, type, description });
      
      // Fetch the updated field type to return
      const updatedFieldType = await clientDataService.getFieldTypeById(id);
      
      res.status(200).json(updatedFieldType)
    } catch (error) {
      console.error('Error updating field type:', error)
      res.status(500).json({ error: 'Failed to update field type' })
    }
  }
  // DELETE - Delete a field type
  else if (req.method === 'DELETE') {
    try {
      // Use clientDataService directly
      await clientDataService.deleteFieldType(id);
      
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