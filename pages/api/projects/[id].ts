import type { NextApiRequest, NextApiResponse } from 'next';
import { spDataService } from '../../../utils/dataService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid project ID' });
  }
  
  switch (req.method) {
    case 'GET':
      try {
        const project = await spDataService.getProjectById(id);
        if (!project) {
          return res.status(404).json({ error: 'Project not found' });
        }
        res.status(200).json(project);
      } catch (error) {
        console.error(`Error fetching project ${id}:`, error);
        res.status(500).json({ error: 'Failed to fetch project' });
      }
      break;
      
    case 'PUT':
      try {
        await spDataService.updateProject(id, req.body);
        res.status(200).json({ message: 'Project updated successfully' });
      } catch (error) {
        console.error(`Error updating project ${id}:`, error);
        res.status(500).json({ error: 'Failed to update project' });
      }
      break;
      
    case 'DELETE':
      try {
        await spDataService.deleteProject(id);
        res.status(200).json({ message: 'Project deleted successfully' });
      } catch (error) {
        console.error(`Error deleting project ${id}:`, error);
        res.status(500).json({ error: 'Failed to delete project' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}