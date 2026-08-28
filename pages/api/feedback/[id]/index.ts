import type { NextApiRequest, NextApiResponse } from 'next';
import type { Prisma } from '@prisma/client';
import { withActivityAudit } from '@/utils/auditLog';
import prisma from '@/lib/prisma';
import { requireSuperAdminAccess } from '@/utils/superAdminAccessServer';

type ApiResponse = { success: true } | { error: string };

const disableCache = (res: NextApiResponse) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
};

const parseFeedbackId = (raw: unknown): number | null => {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = typeof value === 'string' ? Number(value) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
};

const getActorKey = (session: Awaited<ReturnType<typeof requireSuperAdminAccess>>): string => {
  const entra = session.entra && typeof session.entra === 'object' ? session.entra : null;
  const value = entra?.upn || entra?.mail || session.username || session.displayName;
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
};

async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  disableCache(res);

  if (req.method !== 'PATCH' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['PATCH', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  let session;
  try {
    session = await requireSuperAdminAccess(req);
  } catch (error) {
    const status = error instanceof Error && error.message === 'Unauthorized' ? 401 : 403;
    return res
      .status(status)
      .json({ error: status === 401 ? 'Unauthorized' : 'Superadmin access required' });
  }

  const id = parseFeedbackId(req.query.id);
  if (!id) return res.status(400).json({ error: 'Ungültige Feedback-ID.' });

  const existing = await prisma.feedbackRequest.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ error: 'Feedback wurde nicht gefunden.' });

  if (req.method === 'DELETE') {
    await prisma.feedbackRequest.delete({ where: { id } });
    return res.status(200).json({ success: true });
  }

  const hasTitle = Object.prototype.hasOwnProperty.call(req.body || {}, 'title');
  const hasDescription = Object.prototype.hasOwnProperty.call(req.body || {}, 'description');
  const hasStatus = Object.prototype.hasOwnProperty.call(req.body || {}, 'status');
  if (!hasTitle && !hasDescription && !hasStatus) {
    return res.status(400).json({ error: 'Es wurden keine Änderungen übermittelt.' });
  }

  const data: Prisma.FeedbackRequestUpdateInput = {};
  if (hasTitle) {
    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    if (title.length < 4 || title.length > 120) {
      return res.status(400).json({ error: 'Titel muss zwischen 4 und 120 Zeichen lang sein.' });
    }
    data.title = title;
  }

  if (hasDescription) {
    const description =
      typeof req.body?.description === 'string' ? req.body.description.trim() : '';
    if (description.length > 1200) {
      return res.status(400).json({ error: 'Beschreibung darf maximal 1200 Zeichen lang sein.' });
    }
    data.description = description || null;
  }

  if (hasStatus) {
    const status = req.body?.status;
    if (status !== 'OPEN' && status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Ungültiger Feedback-Status.' });
    }
    data.status = status;
    if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      data.completedAt = new Date();
      data.completedBy = getActorKey(session) || null;
    } else if (status === 'OPEN') {
      data.completedAt = null;
      data.completedBy = null;
    }
  }

  await prisma.feedbackRequest.update({ where: { id }, data });
  return res.status(200).json({ success: true });
}

export default withActivityAudit(handler);
