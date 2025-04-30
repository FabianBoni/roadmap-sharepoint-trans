import type { NextApiRequest, NextApiResponse } from 'next';
import { clientDataService } from '@/utils/clientDataService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // For this endpoint, we don't require authentication since it's used by the public roadmap
  
  const { key } = req.query;

  if (!key || typeof key !== 'string') {
    return res.status(400).json({ message: 'Invalid setting key' });
  }

  // Only allow GET requests
  if (req.method === 'GET') {
    try {
      const setting = await clientDataService.getSettingByKey(key);
      
      if (!setting) {
        return res.status(404).json({ message: 'Setting not found' });
      }
      
      return res.status(200).json(setting);
    } catch (error) {
      console.error('Error fetching setting by key:', error);
      return res.status(500).json({ message: 'Error fetching setting' });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}