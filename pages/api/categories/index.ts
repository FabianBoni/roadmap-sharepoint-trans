import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET - Fetch all categories
  if (req.method === 'GET') {
    try {
      const categories = await prisma.category.findMany()
      res.status(200).json(categories)
    } catch (error) {
      console.error('Error fetching categories:', error)
      res.status(500).json({ error: 'Failed to fetch categories' })
    }
  } 
  // POST - Create a new category
  else if (req.method === 'POST') {
    try {
      const { name, color, icon } = req.body
      
      if (!name || !color || !icon) {
        return res.status(400).json({ error: 'Name, color, and icon are required' })
      }
      
      const newCategory = await prisma.category.create({
        data: {
          name,
          color,
          icon,
        },
      })
      
      res.status(201).json(newCategory)
    } catch (error) {
      console.error('Error creating category:', error)
      res.status(500).json({ error: 'Failed to create category' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}