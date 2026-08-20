import type { NextApiRequest, NextApiResponse } from 'next';
import { withActivityAudit } from '@/utils/auditLog';
import { clientDataService } from '@/utils/clientDataService';
import { requireUserSession } from '@/utils/apiAuth';
import {
  isAdminSessionAllowedForInstance,
  isReadSessionAllowedForInstance,
} from '@/utils/instanceAccessServer';
import { getInstanceConfigFromRequest } from '@/utils/instanceConfig';
import { invalidateRoadmapDataCache } from '@/utils/roadmapData';
import type { RoadmapInstanceConfig } from '@/types/roadmapInstance';
import { sanitizeSettingRichTextFields } from '@/utils/richText';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  let instance: RoadmapInstanceConfig | null = null;
  try {
    instance = await getInstanceConfigFromRequest(req);
  } catch {
    console.error('[api/settings/[id]] failed to resolve instance');
    return res.status(500).json({ message: 'Failed to resolve roadmap instance' });
  }
  if (!instance) {
    return res.status(404).json({ message: 'No roadmap instance configured for this request' });
  }

  const forwardedHeaders = {
    authorization:
      typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined,
    cookie: typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined,
  };

  try {
    const session = await requireUserSession(req);
    const allowed =
      req.method === 'GET'
        ? await isReadSessionAllowedForInstance({
            session,
            instance,
            requestHeaders: forwardedHeaders,
          })
        : await isAdminSessionAllowedForInstance({
            session,
            instance,
            requestHeaders: forwardedHeaders,
          });
    if (!allowed) return res.status(403).json({ message: 'Forbidden' });
  } catch {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ message: 'Invalid setting ID' });
  }

  // Handle GET request - fetch a specific setting
  if (req.method === 'GET') {
    try {
      const setting = await clientDataService.withInstance(instance.slug, () =>
        clientDataService.getSettingByKey(id)
      );

      if (!setting) {
        return res.status(404).json({ message: 'Setting not found' });
      }

      return res.status(200).json(setting);
    } catch {
      console.error('Error fetching setting');
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

      const safeSetting = sanitizeSettingRichTextFields({
        id,
        key,
        value,
        description: description || '',
      });

      const updatedSetting = await clientDataService.withInstance(instance.slug, () =>
        clientDataService.updateSetting(safeSetting)
      );

      invalidateRoadmapDataCache();
      return res.status(200).json(updatedSetting);
    } catch {
      console.error('Error updating setting');
      return res.status(500).json({ message: 'Error updating setting' });
    }
  }

  // Handle DELETE request - delete a setting
  else if (req.method === 'DELETE') {
    try {
      await clientDataService.withInstance(instance.slug, () =>
        clientDataService.deleteSetting(id)
      );
      invalidateRoadmapDataCache();
      return res.status(200).json({ message: 'Setting deleted successfully' });
    } catch {
      console.error('Error deleting setting');
      return res.status(500).json({ message: 'Error deleting setting' });
    }
  }

  // Handle unsupported methods
  else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

export default withActivityAudit(handler);
