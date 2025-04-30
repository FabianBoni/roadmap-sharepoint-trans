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

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid setting ID' });
  }

  // Handle GET request - fetch a specific setting
  if (req.method === 'GET') {
    try {
      const setting = await clientDataService.getSettingByKey(id);
      
      if (!setting) {
        return res.status(404).json({ message: 'Setting not found' });
      }
      
      return res.status(200).json(setting);
    } catch (error) {
      console.error('Error fetching setting:', error);
      return res.status(500).json({ message: 'Error fetching setting' });
    }
  }
  
  // Handle PUT request - update a setting
  else if (req.method === 'PUT') {
    try {
      const { key, value, description } = req.body;
      
      // Validate required fields
      if (!key || !value) {
        return res.status(400).json({ message: 'Key and value are required' });
      }
      
      const updatedSetting = await clientDataService.updateSetting({
        id,
        key,
        value,
        description: description || ''
      });
      
      return res.status(200).json(updatedSetting);
    } catch (error) {
      console.error('Error updating setting:', error);
      return res.status(500).json({ message: 'Error updating setting' });
    }
  }
  
  // Handle DELETE request - delete a setting
  else if (req.method === 'DELETE') {
    try {
      await clientDataService.deleteSetting(id);
      return res.status(200).json({ message: 'Setting deleted successfully' });
    } catch (error) {
      console.error('Error deleting setting:', error);
      return res.status(500).json({ message: 'Error deleting setting' });
    }
  }
  
  // Handle unsupported methods
  else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}