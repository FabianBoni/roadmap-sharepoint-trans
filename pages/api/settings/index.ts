import type { NextApiRequest, NextApiResponse } from 'next';
import { clientDataService } from '@/utils/clientDataService';
import { requireUserSession } from '@/utils/apiAuth';
import {
  isAdminSessionAllowedForInstance,
  isReadSessionAllowedForInstance,
} from '@/utils/instanceAccessServer';
import { getInstanceConfigFromRequest } from '@/utils/instanceConfig';
import type { RoadmapInstanceConfig } from '@/types/roadmapInstance';
import { sanitizeSettingRichTextFields } from '@/utils/richText';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let instance: RoadmapInstanceConfig | null = null;
  try {
    instance = await getInstanceConfigFromRequest(req);
  } catch {
    console.error('[api/settings] failed to resolve instance');
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

  if (req.method === 'GET') {
    try {
      const settings = await clientDataService.withInstance(instance.slug, () =>
        clientDataService.getAppSettings()
      );
      return res.status(200).json(settings);
    } catch {
      console.error('Error fetching settings');
      return res.status(500).json({ message: 'Error fetching settings' });
    }
  } else if (req.method === 'POST') {
    try {
      const { key, value, description } = req.body;

      // Validate required fields
      if (!key || !value) {
        return res.status(400).json({ message: 'Key and value are required' });
      }

      const safeSetting = sanitizeSettingRichTextFields({
        key,
        value,
        description: description || '',
      });

      const newSetting = await clientDataService.withInstance(instance.slug, () =>
        clientDataService.createSetting(safeSetting)
      );

      return res.status(201).json(newSetting);
    } catch {
      console.error('Error creating setting');
      return res.status(500).json({ message: 'Error creating setting' });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
