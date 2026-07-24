import { createHash } from 'node:crypto';
import prisma from '@/lib/prisma';

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

export const consumePersistentRateLimit = async (options: {
  scope: string;
  key: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> => {
  const now = new Date();
  const resetAt = new Date(now.getTime() + options.windowMs);
  const keyHash = createHash('sha256').update(options.key).digest('hex');

  const result = await prisma.$transaction(async (tx) => {
    const current = await tx.rateLimitBucket.findUnique({
      where: { scope_keyHash: { scope: options.scope, keyHash } },
    });

    if (!current || current.resetAt <= now) {
      const bucket = await tx.rateLimitBucket.upsert({
        where: { scope_keyHash: { scope: options.scope, keyHash } },
        create: { scope: options.scope, keyHash, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      return { count: bucket.count, resetAt: bucket.resetAt };
    }

    const bucket = await tx.rateLimitBucket.update({
      where: { scope_keyHash: { scope: options.scope, keyHash } },
      data: { count: { increment: 1 } },
    });
    return { count: bucket.count, resetAt: bucket.resetAt };
  });

  if (Math.random() < 0.01) {
    void prisma.rateLimitBucket.deleteMany({ where: { resetAt: { lt: now } } }).catch(() => null);
  }

  return {
    allowed: result.count <= options.limit,
    retryAfterSeconds:
      result.count <= options.limit
        ? 0
        : Math.max(1, Math.ceil((result.resetAt.getTime() - now.getTime()) / 1000)),
  };
};
