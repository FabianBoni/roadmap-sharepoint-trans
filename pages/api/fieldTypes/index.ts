import { NextApiRequest, NextApiResponse } from 'next'
import { clientDataService } from '@/utils/clientDataService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET - Fetch all field types
  if (req.method === 'GET') {
    try {
      // Use clientDataService directly
      const fieldTypes = await clientDataService.getAllFieldTypes();
      
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
      
      if (!name || !type) {
        return res.status(400).json({ error: 'Name and type are required' })
      }
      
      // Use clientDataService directly
      const newFieldType = await clientDataService.createFieldType({ 
        name, 
        type, 
        description: description || '' 
      });
      
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