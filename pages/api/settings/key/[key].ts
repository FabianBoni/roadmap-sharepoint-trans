import type { NextApiRequest, NextApiResponse } from 'next';
import { clientDataService } from '@/utils/clientDataService';
import { getInstanceConfigFromRequest } from '@/utils/instanceConfig';
import type { RoadmapInstanceConfig } from '@/types/roadmapInstance';
import { requireUserSession } from '@/utils/apiAuth';
import { isReadSessionAllowedForInstance } from '@/utils/instanceAccessServer';

const PUBLIC_SETTING_KEYS = new Set([
  'siteTitle',
  'primaryColor',
  'accentColor',
  'gradientFrom',
  'gradientTo',
]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let instance: RoadmapInstanceConfig | null = null;
  try {
    instance = await getInstanceConfigFromRequest(req);
  } catch {
    console.error('[api/settings/key/[key]] failed to resolve instance');
    return res.status(500).json({ message: 'Failed to resolve roadmap instance' });
  }
  if (!instance) {
    return res.status(404).json({ message: 'No roadmap instance configured for this request' });
  }

  const { key } = req.query;

  if (!key || typeof key !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(key)) {
    return res.status(400).json({ message: 'Invalid setting key' });
  }

  if (!PUBLIC_SETTING_KEYS.has(key)) {
    try {
      const session = await requireUserSession(req);
      if (
        !(await isReadSessionAllowedForInstance({
          session,
          instance,
          requestHeaders: {
            authorization:
              typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined,
            cookie: typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined,
          },
        }))
      ) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    } catch {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }

  // Only allow GET requests
  if (req.method === 'GET') {
    try {
      const setting = await clientDataService.withInstance(instance.slug, () =>
        clientDataService.getSettingByKey(key)
      );

      if (!setting) {
        return res.status(404).json({ message: 'Setting not found' });
      }

      if (PUBLIC_SETTING_KEYS.has(key)) {
        return res.status(200).json({ key: setting.key, value: setting.value });
      }
      return res.status(200).json(setting);
    } catch {
      console.error('Error fetching setting by key');
      return res.status(500).json({ message: 'Error fetching setting' });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}
