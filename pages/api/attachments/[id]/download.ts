import type { NextApiRequest, NextApiResponse } from 'next';
import { extname } from 'path';
import { clientDataService } from '@/utils/clientDataService';
import { requireUserSession } from '@/utils/apiAuth';
import { isReadSessionAllowedForInstance } from '@/utils/instanceAccessServer';
import {
  getInstanceConfigFromRequest,
  INSTANCE_COOKIE_NAME,
  INSTANCE_QUERY_PARAM,
} from '@/utils/instanceConfig';
import type { RoadmapInstanceConfig } from '@/types/roadmapInstance';

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : null;

type LibraryFile = { FileName: string; ServerRelativeUrl: string };

const buildServerRelativeUrl = (folderUrl: string, fileName: string): string => {
  const normalizedFolder = folderUrl.replace(/\/$/, '');
  const encodedName = encodeURIComponent(fileName).replace(/%2F/g, '/');
  return `${normalizedFolder}/${encodedName}`;
};

const findFileByName = (payload: unknown, name: string, folderUrl: string): LibraryFile | null => {
  const expected = String(name).toLowerCase();
  const candidates = Array.isArray(payload)
    ? payload
    : Array.isArray(asRecord(payload)?.value)
      ? (asRecord(payload)?.value as unknown[])
      : Array.isArray(
            asRecord(payload)?.d &&
              asRecord(payload)?.d &&
              (asRecord(payload)?.d as Record<string, unknown>).results
          )
        ? ((asRecord(payload)?.d as Record<string, unknown>).results as unknown[])
        : [];

  for (const entry of candidates) {
    const rec = asRecord(entry);
    if (!rec) continue;
    const fileName =
      typeof rec.FileName === 'string'
        ? rec.FileName
        : typeof rec.Name === 'string'
          ? rec.Name
          : '';
    const serverRelativeUrlRaw =
      typeof rec.ServerRelativeUrl === 'string'
        ? rec.ServerRelativeUrl
        : typeof asRecord(rec.ServerRelativePath)?.DecodedUrl === 'string'
          ? String(asRecord(rec.ServerRelativePath)?.DecodedUrl)
          : '';
    const serverRelativeUrl =
      serverRelativeUrlRaw || (fileName ? buildServerRelativeUrl(folderUrl, fileName) : '');
    if (!fileName || !serverRelativeUrl) continue;
    if (fileName.toLowerCase() === expected)
      return { FileName: fileName, ServerRelativeUrl: serverRelativeUrl };
  }
  return null;
};

const mimeByExtension: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.bmp': 'image/bmp',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.zip': 'application/zip',
};

const GENERIC_CONTENT_TYPES = new Set([
  'application/octet-stream',
  'text/plain',
  'text/html',
  'application/json',
  'text/json',
  'application/xml',
  'text/xml',
]);

const normalizeContentType = (value: string): string => value.split(';', 1)[0].trim().toLowerCase();

const shouldPreferExtensionMime = (
  contentType: string,
  extensionMime: string | undefined
): boolean => {
  if (!extensionMime) return !contentType;
  if (!contentType) return true;

  const normalizedCurrent = normalizeContentType(contentType);
  const normalizedExtension = normalizeContentType(extensionMime);

  if (normalizedCurrent === normalizedExtension) return false;
  if (GENERIC_CONTENT_TYPES.has(normalizedCurrent)) return true;
  if (normalizedExtension.startsWith('image/') && !normalizedCurrent.startsWith('image/')) {
    return true;
  }
  if (normalizedExtension === 'application/pdf' && normalizedCurrent !== 'application/pdf') {
    return true;
  }
  return false;
};

const isInlinePreviewType = (contentType: string): boolean => {
  const normalized = normalizeContentType(contentType);
  return (
    normalized.startsWith('image/') ||
    normalized === 'application/pdf' ||
    normalized === 'text/plain' ||
    normalized === 'text/csv'
  );
};

const buildContentDisposition = (fileName: string, inline: boolean): string => {
  const escaped = fileName.replace(/"/g, '');
  return `${inline ? 'inline' : 'attachment'}; filename="${escaped}"`;
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let session: ReturnType<typeof requireUserSession>;
  try {
    session = requireUserSession(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query as { id?: string };
  const name = req.query.name as string | undefined;

  if (!id || Array.isArray(id) || !name) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    let instance: RoadmapInstanceConfig | null = null;
    try {
      instance = await getInstanceConfigFromRequest(req);
    } catch (error) {
      console.error('[attachments:download] failed to resolve instance', error);
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

    const libraryTitle = await clientDataService.withInstance(instance.slug, () =>
      clientDataService.resolveListTitle('Roadmap Documents')
    );

    const encodedTitle = encodeURIComponent(libraryTitle);
    const listInfoUrl = `${baseUrl}/api/sharepoint/_api/web/lists/getByTitle('${encodedTitle}')?$select=RootFolder/ServerRelativeUrl&$expand=RootFolder`;
    const rootResp = await fetch(withSlug(listInfoUrl), {
      headers: attachHeaders({ Accept: 'application/json;odata=nometadata' }),
    });
    const rootText = await rootResp.text();
    if (!rootResp.ok) {
      return res.status(rootResp.status).json({ error: 'download-failed', detail: rootText });
    }
    const rootPayload = (() => {
      try {
        return JSON.parse(rootText);
      } catch {
        return rootText;
      }
    })();
    const rootFolderUrl =
      (asRecord(rootPayload)?.RootFolder as Record<string, unknown> | undefined)
        ?.ServerRelativeUrl ||
      ((asRecord(rootPayload)?.d as Record<string, unknown> | undefined)?.RootFolder &&
        (asRecord((asRecord(rootPayload)?.d as Record<string, unknown> | undefined)?.RootFolder)
          ?.ServerRelativeUrl as string | undefined));

    if (!rootFolderUrl || typeof rootFolderUrl !== 'string') {
      return res.status(500).json({ error: 'download-failed', detail: 'library-root-missing' });
    }

    const fileFolderUrl = `${rootFolderUrl.replace(/\/$/, '')}/${encodeURIComponent(String(id))}`;
    const listUrl = withSlug(
      `${baseUrl}/api/sharepoint/_api/web/GetFolderByServerRelativeUrl('${encodeURI(
        fileFolderUrl
      ).replace(/'/g, "''")}')/Files?$select=Name,ServerRelativeUrl`
    );

    const listResp = await fetch(listUrl, {
      headers: attachHeaders({ Accept: 'application/json;odata=nometadata' }),
    });
    const listText = await listResp.text();
    if (!listResp.ok) {
      return res.status(listResp.status).json({ error: 'download-failed', detail: listText });
    }

    let listPayload: unknown;
    try {
      listPayload = JSON.parse(listText);
    } catch {
      listPayload = listText;
    }

    const match = findFileByName(listPayload, name, fileFolderUrl);
    if (!match?.ServerRelativeUrl) {
      return res.status(404).json({ error: 'download-failed', detail: 'file-not-found' });
    }

    const encodedServerRelative = encodeURI(String(match.ServerRelativeUrl)).replace(/'/g, "''");
    const fileResp = await fetch(
      withSlug(
        `${baseUrl}/api/sharepoint/_api/web/GetFileByServerRelativeUrl('${encodedServerRelative}')/$value`
      ),
      {
        headers: attachHeaders({ Accept: '*/*' }),
      }
    );

    if (!fileResp.ok) {
      const detail = await fileResp.text();
      return res.status(fileResp.status).json({ error: 'download-failed', detail });
    }

    let contentType = fileResp.headers.get('content-type') || '';
    const ext = extname(name).toLowerCase();
    const extensionMime = ext ? mimeByExtension[ext] : undefined;

    if (shouldPreferExtensionMime(contentType, extensionMime)) {
      contentType = extensionMime || 'application/octet-stream';
    } else if (!contentType) {
      contentType = 'application/octet-stream';
    }

    const contentDisposition = buildContentDisposition(name, isInlinePreviewType(contentType));
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', contentDisposition);

    const contentLength = fileResp.headers.get('content-length');
    if (contentLength) res.setHeader('Content-Length', contentLength);

    const body = Buffer.from(await fileResp.arrayBuffer());
    return res.status(200).send(body);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'download failed';
    return res.status(500).json({ error: message });
  }
}
