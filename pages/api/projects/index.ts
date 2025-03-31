import type { NextApiRequest, NextApiResponse } from 'next';
import { spDataService } from '../../../utils/dataService';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      try {
        const projects = await spDataService.getAllProjects();
        res.status(200).json(projects);
      } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
      }
      break;
      
    case 'POST':
      try {
        const newProject = await spDataService.createProject(req.body);
        res.status(201).json(newProject);
      } catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
      }
      break;
      
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}