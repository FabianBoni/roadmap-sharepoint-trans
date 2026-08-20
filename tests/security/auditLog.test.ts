import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAuditEventData, runWithAudit, withActivityAudit } from '../../utils/auditLog';

const session = {
  username: 'USER@example.test',
  displayName: 'Example User',
  source: 'entra',
  entra: {
    id: 'object-id',
    tenantId: 'tenant-id',
    upn: 'user@example.test',
  },
};

test('audit data contains only the explicit safe metadata and removes query values', () => {
  const data = buildAuditEventData(
    {
      req: {
        method: 'PATCH',
        url: '/api/projects/42?access_token=top-secret&roadmapInstance=sample',
      },
      session,
    },
    {
      action: 'Project.Updated',
      entityType: 'Project',
      entityId: 42,
      entityLabel: '  Neue   Roadmap\n',
      instanceSlug: 'SAMPLE',
    }
  );

  assert.deepEqual(data, {
    action: 'project.updated',
    entityType: 'project',
    entityId: '42',
    entityLabel: 'Neue Roadmap',
    actorKey: 'tenant-id:object-id',
    actorDisplayName: 'Example User',
    actorSource: 'entra',
    instanceSlug: 'sample',
    visibility: 'instance',
    requestMethod: 'PATCH',
    requestPath: '/api/projects/42',
  });
  assert.equal(JSON.stringify(data).includes('top-secret'), false);
});

test('runWithAudit records only successful mutations', async () => {
  const writes: unknown[] = [];
  const common = {
    req: { method: 'POST', url: '/api/projects' },
    session,
    writer: async (data: unknown) => {
      writes.push(data);
    },
  };

  await assert.rejects(
    runWithAudit(
      {
        ...common,
        event: { action: 'project.created', entityType: 'project' },
      },
      async () => {
        throw new Error('mutation failed');
      }
    ),
    /mutation failed/
  );
  assert.equal(writes.length, 0);

  const result = await runWithAudit(
    {
      ...common,
      event: (project: { id: number; title: string }) => ({
        action: 'project.created',
        entityType: 'project',
        entityId: project.id,
        entityLabel: project.title,
        instanceSlug: 'sample',
      }),
    },
    async () => ({ id: 7, title: 'Testprojekt' })
  );

  assert.equal(result.id, 7);
  assert.equal(writes.length, 1);
});

test('audit events reject non-mutating HTTP methods and unidentified actors', () => {
  assert.throws(
    () =>
      buildAuditEventData(
        { req: { method: 'GET', url: '/api/projects' }, session },
        { action: 'project.read', entityType: 'project' }
      ),
    /mutating HTTP method/
  );
  assert.throws(
    () =>
      buildAuditEventData(
        { req: { method: 'DELETE', url: '/api/projects/1' }, session: {} },
        { action: 'project.deleted', entityType: 'project' }
      ),
    /unidentified session/
  );
});

test('withActivityAudit records 2xx mutations and is fail-open', async () => {
  const writes: unknown[] = [];
  const makeRequest = (method: string) =>
    ({
      method,
      url: '/api/projects/42?token=secret',
      query: { token: 'secret', roadmapInstance: 'sample' },
      headers: {},
    }) as never;
  const makeResponse = (statusCode: number) => ({ statusCode }) as never;
  const handler = async (_req: never, res: { statusCode: number }) => {
    res.statusCode = 204;
  };

  const audited = withActivityAudit(handler as never, {
    sessionResolver: async () => session,
    instanceSlugResolver: async () => 'sample',
    writer: async (data) => {
      writes.push(data);
    },
  });
  const response = makeResponse(200) as { statusCode: number };
  await audited(makeRequest('PATCH'), response as never);
  assert.equal(response.statusCode, 204);
  assert.equal(writes.length, 1);
  assert.equal(JSON.stringify(writes).includes('secret'), false);

  const failOpen = withActivityAudit(handler as never, {
    sessionResolver: async () => session,
    instanceSlugResolver: async () => 'sample',
    writer: async () => {
      throw new Error('audit unavailable');
    },
  });
  const failOpenResponse = makeResponse(200) as { statusCode: number };
  await failOpen(makeRequest('DELETE'), failOpenResponse as never);
  assert.equal(failOpenResponse.statusCode, 204);
});

test('withActivityAudit applies safe route classifications', async () => {
  const writes: Array<Record<string, unknown>> = [];
  const handler = async (_req: never, res: { statusCode: number }) => {
    res.statusCode = 201;
  };
  const audited = withActivityAudit(handler as never, {
    sessionResolver: async () => session,
    instanceSlugResolver: async () => 'sample',
    writer: async (data) => {
      writes.push(data);
    },
  });
  const response = () => ({ statusCode: 200 }) as never;
  const request = (method: string, url: string) =>
    ({ method, url, query: {}, headers: {} }) as never;

  await audited(request('POST', '/api/attachments'), response());
  await audited(request('POST', '/api/categories/reorder'), response());
  await audited(request('POST', '/api/feedback/12/vote'), response());
  await audited(request('DELETE', '/api/instance-admin-users'), response());

  assert.deepEqual(
    writes.map(({ action, entityType, visibility, instanceSlug }) => ({
      action,
      entityType,
      visibility,
      instanceSlug,
    })),
    [
      {
        action: 'attachment.uploaded',
        entityType: 'attachment',
        visibility: 'instance',
        instanceSlug: 'sample',
      },
      {
        action: 'category_order.reordered',
        entityType: 'category_order',
        visibility: 'instance',
        instanceSlug: 'sample',
      },
      {
        action: 'feedback_vote.vote_set',
        entityType: 'feedback_vote',
        visibility: 'instance',
        instanceSlug: 'sample',
      },
      {
        action: 'instance-admin-user.deleted',
        entityType: 'instance-admin-user',
        visibility: 'admin',
        instanceSlug: 'sample',
      },
    ]
  );
});

test('withActivityAudit skips failed responses and accepts redirects as success', async () => {
  const writes: unknown[] = [];
  const makeWrapper = (statusCode: number) =>
    withActivityAudit(
      (async (_req: never, res: { statusCode: number }) => {
        res.statusCode = statusCode;
      }) as never,
      {
        sessionResolver: async () => session,
        instanceSlugResolver: async () => 'sample',
        writer: async (data) => {
          writes.push(data);
        },
      }
    );
  const request = { method: 'POST', url: '/api/auth/logout', query: {}, headers: {} } as never;

  await makeWrapper(403)(request, { statusCode: 200 } as never);
  assert.equal(writes.length, 0);
  await makeWrapper(302)(request, { statusCode: 200 } as never);
  assert.equal(writes.length, 1);
  assert.equal((writes[0] as { visibility: string }).visibility, 'security');
});
