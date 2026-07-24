import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { requireUserSession } from '@/utils/apiAuth';
import { isAdminSessionAllowedForInstance } from '@/utils/instanceAccessServer';
import { isSuperAdminSessionWithSharePointFallback } from '@/utils/superAdminAccessServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const session = await requireUserSession(req);
    const groups = Array.isArray(session.groups)
      ? session.groups.filter((g): g is string => typeof g === 'string')
      : [];
    const requestHeaders = {
      authorization:
        typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined,
      cookie: typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined,
    };
    const candidateInstanceSlugs = (
      await prisma.roadmapInstance.findMany({ select: { slug: true }, orderBy: { slug: 'asc' } })
    )
      .map((record) => String(record.slug || '').trim())
      .filter(Boolean);
    const isSuperAdmin = await isSuperAdminSessionWithSharePointFallback(session, {
      candidateInstanceSlugs,
      requestHeaders,
    });
    let isAdmin = isSuperAdmin;
    if (!isAdmin) {
      for (const slug of candidateInstanceSlugs) {
        if (
          await isAdminSessionAllowedForInstance({
            session,
            instance: { slug },
            requestHeaders,
            knownSuperAdmin: false,
          })
        ) {
          isAdmin = true;
          break;
        }
      }
    }

    return res.status(200).json({
      username: session.username ?? null,
      displayName: session.displayName ?? null,
      source: session.source ?? null,
      isAdmin,
      isSuperAdmin,
      groups,
      entra: session.entra ?? null,
    });
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
