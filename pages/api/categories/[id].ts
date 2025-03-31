import { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid category ID' })
  }

  // GET - Fetch a single category
  if (req.method === 'GET') {
    try {
      const category = await prisma.category.findUnique({
        where: { id },
      })

      if (!category) {
        // For debugging, let's log what IDs we do have
        const allCategories = await prisma.category.findMany({
          select: { id: true, name: true }
        });
        console.log('Available category IDs:', allCategories);

        return res.status(404).json({ error: 'Category not found' })
      }

      res.status(200).json(category)
    } catch (error) {
      console.error('Error fetching category:', error)
      res.status(500).json({ error: 'Failed to fetch category' })
    }
  }
  // PUT - Update a category
  else if (req.method === 'PUT') {
    try {
      const { name, color, icon } = req.body

      if (!name || !color || !icon) {
        return res.status(400).json({ error: 'Name, color, and icon are required' })
      }

      const updatedCategory = await prisma.category.update({
        where: { id },
        data: {
          name,
          color,
          icon,
        },
      })

      res.status(200).json(updatedCategory)
    } catch (error) {
      console.error('Error updating category:', error)
      res.status(500).json({ error: 'Failed to update category' })
    }
  }
  // DELETE - Delete a category
  else if (req.method === 'DELETE') {
    try {
      await prisma.category.delete({
        where: { id },
      })

      res.status(204).end()
    } catch (error) {
      console.error('Error deleting category:', error)
      res.status(500).json({ error: 'Failed to delete category' })
    }
  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}