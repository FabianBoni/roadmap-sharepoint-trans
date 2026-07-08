import type { NextApiRequest, NextApiResponse } from 'next';
import { clientDataService } from '@/utils/clientDataService';
import { requireUserSession } from '@/utils/apiAuth';
import { isReadSessionAllowedForInstance } from '@/utils/instanceAccessServer';
import {
  getInstanceConfigFromRequest,
  INSTANCE_COOKIE_NAME,
  INSTANCE_QUERY_PARAM,
} from '@/utils/instanceConfig';
import type { RoadmapInstanceConfig } from '@/types/roadmapInstance';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: NextApiRequest): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  return await new Promise((resolve, reject) => {
    req.on('data', (chunk: unknown) => {
      if (chunk instanceof Uint8Array) chunks.push(chunk);
      else if (typeof chunk === 'string') chunks.push(new TextEncoder().encode(chunk));
      else if (chunk) {
        try {
          chunks.push(new Uint8Array(chunk as ArrayBufferLike));
        } catch {
          /* ignore */
        }
      }
    });
    req.on('end', () => {
      const total = chunks.reduce((sum, part) => sum + part.length, 0);
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const part of chunks) {
        merged.set(part, offset);
        offset += part.length;
      }
      resolve(merged);
    });
    req.on('error', reject);
  });
}

const encodeServerRelativeUrl = (value: string): string => encodeURI(value).replace(/'/g, "''");

const extractJsonPayload = (raw: string, contentType: string): unknown => {
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;

const getNested = (value: unknown, path: string[]): unknown => {
  let current: unknown = value;
  for (const key of path) {
    const obj = asRecord(current);
    if (!obj) return undefined;
    current = obj[key];
  }
  return current;
};

type LibraryFile = { FileName: string; ServerRelativeUrl: string };

const buildServerRelativeUrl = (folderUrl: string, fileName: string): string => {
  const normalizedFolder = folderUrl.replace(/\/$/, '');
  const encodedName = encodeURIComponent(fileName).replace(/%2F/g, '/');
  return `${normalizedFolder}/${encodedName}`;
};

const coerceFileItem = (value: unknown, folderUrl: string): LibraryFile | null => {
  const rec = asRecord(value);
  if (!rec) return null;
  const fileName =
    typeof rec.FileName === 'string'
      ? rec.FileName
      : typeof rec.Name === 'string'
        ? rec.Name
        : null;
  const serverRelativeUrlRaw =
    typeof rec.ServerRelativeUrl === 'string'
      ? rec.ServerRelativeUrl
      : typeof getNested(rec, ['ServerRelativePath', 'DecodedUrl']) === 'string'
        ? String(getNested(rec, ['ServerRelativePath', 'DecodedUrl']))
        : null;
  const serverRelativeUrl =
    serverRelativeUrlRaw && serverRelativeUrlRaw.trim().length > 0
      ? serverRelativeUrlRaw
      : fileName
        ? buildServerRelativeUrl(folderUrl, fileName)
        : null;
  if (!fileName || !serverRelativeUrl) return null;
  return { FileName: fileName, ServerRelativeUrl: serverRelativeUrl };
};

const extractFileArray = (payload: unknown, folderUrl: string): LibraryFile[] => {
  const direct = asRecord(payload);
  if (Array.isArray(direct?.value)) {
    return direct.value
      .map((item) => coerceFileItem(item, folderUrl))
      .filter((item): item is LibraryFile => Boolean(item));
  }

  const results = getNested(payload, ['d', 'results']);
  if (Array.isArray(results)) {
    return results
      .map((item) => coerceFileItem(item, folderUrl))
      .filter((item): item is LibraryFile => Boolean(item));
  }

  return [];
};

const shouldRetryAsLegacy = (status: number, bodyText: string) => {
  if (status === 400) return true;
  return /InvalidClientQuery|Invalid argument|OData\s+version|unsupported/i.test(bodyText);
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query as { id: string };
  const name = (req.query.name as string) || '';

  if (!id || Array.isArray(id)) return res.status(400).json({ error: 'Invalid id' });

  let session: ReturnType<typeof requireUserSession>;
  try {
    session = requireUserSession(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let instance: RoadmapInstanceConfig | null = null;
    try {
      instance = await getInstanceConfigFromRequest(req);
    } catch (error) {
      console.error('[api/attachments] failed to resolve instance', error);
      return res.status(500).json({ error: 'Failed to resolve roadmap instance' });
    }
    if (!instance) {
      return res.status(404).json({ error: 'No roadmap instance configured for this request' });
    }

    const forwardedHeaders = {
      authorization:
        typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined,
      cookie: typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined,
    };

    if (
      !(await isReadSessionAllowedForInstance({
        session,
        instance,
        requestHeaders: forwardedHeaders,
      }))
    ) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const baseUrl =
      (process.env.INTERNAL_API_BASE_URL || '').replace(/\/$/, '') ||
      `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers['x-forwarded-host'] || req.headers.host}`;

    const withSlug = (rawUrl: string) => {
      try {
        const urlObj = new URL(rawUrl);
        urlObj.searchParams.set(INSTANCE_QUERY_PARAM, instance!.slug);
        return urlObj.toString();
      } catch {
        return rawUrl.includes('?')
          ? `${rawUrl}&${INSTANCE_QUERY_PARAM}=${encodeURIComponent(instance!.slug)}`
          : `${rawUrl}?${INSTANCE_QUERY_PARAM}=${encodeURIComponent(instance!.slug)}`;
      }
    };

    const attachHeaders = (headers: HeadersInit = {}) => {
      const h = new Headers(headers);
      h.set('x-roadmap-instance', instance!.slug);
      const cookieValue = `${INSTANCE_COOKIE_NAME}=${instance!.slug}`;
      const existingCookie = h.get('cookie');
      if (existingCookie) {
        const segments = existingCookie
          .split(';')
          .map((segment) => segment.trim())
          .filter(Boolean)
          .filter((segment) => !segment.toLowerCase().startsWith(`${INSTANCE_COOKIE_NAME}=`));
        segments.push(cookieValue);
        h.set('cookie', segments.join('; '));
      } else {
        h.set('cookie', cookieValue);
      }
      return h;
    };

    const resolveStorageTitle = async (): Promise<string> => {
      return await clientDataService.withInstance(instance.slug, () =>
        clientDataService.resolveListTitle('Roadmap Documents')
      );
    };

    const storageTitle = await resolveStorageTitle();
    const encodedTitle = encodeURIComponent(storageTitle);
    const listInfoUrl = `${baseUrl}/api/sharepoint/_api/web/lists/getByTitle('${encodedTitle}')?$select=RootFolder/ServerRelativeUrl&$expand=RootFolder`;

    const getRootFolderUrl = async (): Promise<string> => {
      const url = withSlug(listInfoUrl);
      const r = await fetch(url, {
        headers: attachHeaders({ Accept: 'application/json;odata=nometadata' }),
      });
      const txt = await r.text();
      const payload = extractJsonPayload(txt, r.headers.get('content-type') || '');
      if (!r.ok) {
        throw new Error(`list-root-folder-failed:${r.status}`);
      }
      const rootUrl = (getNested(payload, ['RootFolder', 'ServerRelativeUrl']) ??
        getNested(payload, ['d', 'RootFolder', 'ServerRelativeUrl']) ??
        '') as unknown;
      if (!rootUrl) throw new Error('list-root-folder-missing');
      return String(rootUrl);
    };

    const getProjectFolderUrl = (rootFolderUrl: string): string =>
      `${rootFolderUrl.replace(/\/$/, '')}/${encodeURIComponent(String(id))}`;

    const ensureProjectFolder = async (rootFolderUrl: string) => {
      const parent = rootFolderUrl.replace(/\/$/, '');
      const url = withSlug(
        `${baseUrl}/api/sharepoint/_api/web/GetFolderByServerRelativeUrl('${encodeServerRelativeUrl(parent)}')/Folders/add('${encodeURIComponent(
          String(id)
        )}')`
      );
      const r = await fetch(url, {
        method: 'POST',
        headers: attachHeaders({
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json;odata=verbose',
        }),
      });
      if (!r.ok && r.status !== 409) {
        const body = await r.text();
        throw new Error(`attachments-folder-failed:${r.status}:${body}`);
      }
    };

    const fileUrlFor = (rootFolderUrl: string, fileName: string): string => {
      const folderUrl = getProjectFolderUrl(rootFolderUrl);
      return `${folderUrl}/${fileName}`;
    };

    const ensureEmptyFile = async (fileUrl: string) => {
      const addUrl = withSlug(
        `${baseUrl}/api/sharepoint/_api/web/GetFolderByServerRelativeUrl('${encodeServerRelativeUrl(
          fileUrl.slice(0, fileUrl.lastIndexOf('/'))
        )}')/Files/add(url='${encodeURIComponent(fileUrl.slice(fileUrl.lastIndexOf('/') + 1)).replace(/'/g, "''")}',overwrite=true)`
      );
      const r = await fetch(addUrl, {
        method: 'POST',
        headers: attachHeaders({
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/octet-stream',
        }),
        body: new Uint8Array(0),
      });
      if (!r.ok && r.status !== 409) {
        const body = await r.text();
        if (!/already exists|bereits vorhanden|duplicate|same name/i.test(body)) {
          throw new Error(`attachment-file-init-failed:${r.status}:${body}`);
        }
      }
    };

    const deleteFile = async (rootFolderUrl: string, fileName: string) => {
      const fileUrl = fileUrlFor(rootFolderUrl, fileName);
      const url = withSlug(
        `${baseUrl}/api/sharepoint/_api/web/GetFileByServerRelativeUrl('${encodeServerRelativeUrl(fileUrl)}')`
      );
      const r = await fetch(url, {
        method: 'POST',
        headers: attachHeaders({
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json;odata=verbose',
          'X-HTTP-Method': 'DELETE',
          'IF-MATCH': '*',
        }),
      });
      if (!r.ok) {
        const body = await r.text();
        throw new Error(`sp-delete-failed:${r.status}:${body}`);
      }
    };

    if (req.method === 'GET') {
      const rootFolderUrl = await getRootFolderUrl();
      const folderUrl = getProjectFolderUrl(rootFolderUrl);
      const listUrl = withSlug(
        `${baseUrl}/api/sharepoint/_api/web/GetFolderByServerRelativeUrl('${encodeServerRelativeUrl(
          folderUrl
        )}')/Files?$select=Name,ServerRelativeUrl`
      );

      const tryFetch = async (accept: string) => {
        const r = await fetch(listUrl, {
          headers: attachHeaders({ Accept: accept }),
        });
        const txt = await r.text();
        const ct = r.headers.get('content-type') || '';
        const payload = extractJsonPayload(txt, ct);
        return { r, txt, ct, payload };
      };

      let attempt = await tryFetch('application/json;odata=nometadata');
      if (!attempt.r.ok && shouldRetryAsLegacy(attempt.r.status, String(attempt.txt || ''))) {
        attempt = await tryFetch('application/json;odata=verbose');
      }
      if (!attempt.r.ok && shouldRetryAsLegacy(attempt.r.status, String(attempt.txt || ''))) {
        const atomResp = await fetch(listUrl, {
          headers: attachHeaders({ Accept: 'application/atom+xml' }),
        });
        const atomText = await atomResp.text();
        if (!atomResp.ok) {
          return res.status(atomResp.status).json({ error: 'sp-error', payload: atomText });
        }
        try {
          const entries = atomText.match(/<entry[\s\S]*?<\/entry>/gi) || [];
          const items = entries
            .map((entry) => {
              const fileNameMatch = entry.match(/<d:FileName[^>]*>([\s\S]*?)<\/d:FileName>/i);
              const nameMatch = entry.match(/<d:Name[^>]*>([\s\S]*?)<\/d:Name>/i);
              const urlMatch = entry.match(
                /<d:ServerRelativeUrl[^>]*>([\s\S]*?)<\/d:ServerRelativeUrl>/i
              );
              const FileName = fileNameMatch?.[1]?.trim() || nameMatch?.[1]?.trim() || '';
              const ServerRelativeUrl = urlMatch?.[1]?.trim() || '';
              return FileName && ServerRelativeUrl ? { FileName, ServerRelativeUrl } : null;
            })
            .filter(Boolean);
          return res.status(200).json(items);
        } catch {
          return res.status(200).json([]);
        }
      }

      if (!attempt.r.ok) {
        if (attempt.r.status === 404) return res.status(200).json([]);
        return res.status(attempt.r.status).json({ error: 'sp-error', payload: attempt.payload });
      }

      const files = extractFileArray(attempt.payload, folderUrl);
      return res.status(200).json(files);
    }

    if (req.method === 'POST') {
      if (!name) return res.status(400).json({ error: 'Missing name' });

      const rootFolderUrl = await getRootFolderUrl();
      await ensureProjectFolder(rootFolderUrl);
      const projectFolderUrl = getProjectFolderUrl(rootFolderUrl);
      const fileUrl = fileUrlFor(rootFolderUrl, name);
      const encodedFileUrl = encodeServerRelativeUrl(fileUrl);
      const filePath = `${baseUrl}/api/sharepoint/_api/web/GetFileByServerRelativeUrl('${encodedFileUrl}')`;
      const folderPath = `${baseUrl}/api/sharepoint/_api/web/GetFolderByServerRelativeUrl('${encodeServerRelativeUrl(
        projectFolderUrl
      )}')`;

      const isChunked = String(req.query.chunked || '').toLowerCase() === '1';
      if (isChunked) {
        const actionRaw = req.query.action;
        const action = Array.isArray(actionRaw) ? actionRaw[0] : actionRaw;
        const uploadIdRaw = req.query.uploadId;
        const uploadId = Array.isArray(uploadIdRaw) ? uploadIdRaw[0] : uploadIdRaw;
        const offsetRaw = req.query.offset;
        const offset = Number(Array.isArray(offsetRaw) ? offsetRaw[0] : offsetRaw || 0);

        if (!action || !uploadId || Number.isNaN(offset)) {
          return res.status(400).json({ error: 'Missing chunked upload parameters' });
        }

        const binary = await readRawBody(req);
        if (action === 'start') {
          try {
            await ensureEmptyFile(fileUrl);
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : 'attachment-file-init-error';
            return res.status(500).json({ error: msg });
          }
        }

        let spEndpoint = '';
        if (action === 'start') {
          spEndpoint = `${filePath}/StartUpload(uploadId=guid'${uploadId}')`;
        } else if (action === 'continue') {
          spEndpoint = `${filePath}/ContinueUpload(uploadId=guid'${uploadId}',fileOffset=${offset})`;
        } else if (action === 'finish') {
          spEndpoint = `${filePath}/FinishUpload(uploadId=guid'${uploadId}',fileOffset=${offset})`;
        } else {
          return res.status(400).json({ error: 'Invalid chunked action' });
        }

        const r = await fetch(withSlug(spEndpoint), {
          method: 'POST',
          headers: attachHeaders({
            Accept: 'application/json;odata=nometadata',
            'Content-Type': 'application/octet-stream',
          }),
          body: binary,
        });
        const bodyText = await r.text();
        if (!r.ok) {
          return res.status(r.status).json({ error: 'sp-upload-failed', body: bodyText });
        }

        const payload = extractJsonPayload(bodyText, r.headers.get('content-type') || '');
        const nextOffset =
          getNested(payload, ['value']) ??
          getNested(payload, ['d', 'StartUpload']) ??
          getNested(payload, ['d', 'ContinueUpload']) ??
          getNested(payload, ['d', 'FinishUpload']) ??
          undefined;

        return res.status(200).json({ ok: true, nextOffset });
      }

      const binary = await readRawBody(req);
      const addUrl = withSlug(
        `${folderPath}/Files/add(url='${encodeURIComponent(name).replace(/'/g, "''")}',overwrite=true)`
      );
      const r = await fetch(addUrl, {
        method: 'POST',
        headers: attachHeaders({
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/octet-stream',
        }),
        body: binary,
      });
      const body = await r.text();
      if (!r.ok) return res.status(r.status).json({ error: 'sp-upload-failed', body });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      if (!name) return res.status(400).json({ error: 'Missing name' });
      const rootFolderUrl = await getRootFolderUrl();
      await deleteFile(rootFolderUrl, name);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET,POST,DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'attachments error';
    return res.status(500).json({ error: message });
  }
}
