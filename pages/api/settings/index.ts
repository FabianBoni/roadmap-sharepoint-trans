import type { NextApiRequest, NextApiResponse } from 'next';
import { clientDataService } from '@/utils/clientDataService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check authentication for write operations
  if (req.method !== 'GET') {
    try {
      const isAdmin = await clientDataService.isCurrentUserAdmin();
      if (!isAdmin) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }

  if (req.method === 'GET') {
    try {
      const settings = await clientDataService.getAppSettings();
      return res.status(200).json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      return res.status(500).json({ message: 'Error fetching settings' });
    }
  } else if (req.method === 'POST') {
    try {
      const { key, value, description } = req.body;
      
      // Validate required fields
      if (!key || !value) {
        return res.status(400).json({ message: 'Key and value are required' });
      }
      
      const newSetting = await clientDataService.createSetting({
        key,
        value,
        description: description || ''
      });
      
      return res.status(201).json(newSetting);
    } catch (error) {
      console.error('Error creating setting:', error);
      return res.status(500).json({ message: 'Error creating setting' });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}