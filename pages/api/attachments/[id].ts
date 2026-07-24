import type { NextApiRequest, NextApiResponse } from 'next';
import { clientDataService } from '@/utils/clientDataService';
import { requireUserSession } from '@/utils/apiAuth';
import {
  isAdminSessionAllowedForInstance,
  isReadSessionAllowedForInstance,
} from '@/utils/instanceAccessServer';
import {
  getInstanceConfigFromRequest,
  INSTANCE_COOKIE_NAME,
  INSTANCE_QUERY_PARAM,
} from '@/utils/instanceConfig';
import type { RoadmapInstanceConfig } from '@/types/roadmapInstance';
import {
  AttachmentValidationError,
  buildStorageFileName,
  toAttachmentDocument,
  validateAttachmentName,
  validateDeclaredSize,
  validateDocumentId,
  validateInitialFileContent,
  validateProjectId,
} from '@/utils/attachmentDocuments';
import { randomUUID } from 'crypto';
import { getInternalApiBaseUrl } from '@/utils/internalApiBaseUrl';
import { MalwareScanError, scanBufferForMalware } from '@/utils/malwareScan';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function readRawBody(req: NextApiRequest, maxBytes: number): Promise<Uint8Array> {
  const chunks: Uint8Array[] = [];
  let total = 0;
  for await (const chunk of req as AsyncIterable<unknown>) {
    const bytes =
      typeof chunk === 'string'
        ? new TextEncoder().encode(chunk)
        : chunk instanceof Uint8Array
          ? chunk
          : new Uint8Array(chunk as ArrayBufferLike);
    total += bytes.byteLength;
    if (total > maxBytes) {
      throw new AttachmentValidationError('Upload payload is too large', 413);
    }
    chunks.push(bytes);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const part of chunks) {
    merged.set(part, offset);
    offset += part.byteLength;
  }
  return merged;
}

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
};

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
  let projectId: string;
  try {
    projectId = validateProjectId(req.query.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid project ID';
    return res.status(400).json({ error: message });
  }

  let session: Awaited<ReturnType<typeof requireUserSession>>;
  try {
    session = await requireUserSession(req);
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let instance: RoadmapInstanceConfig | null = null;
    try {
      instance = await getInstanceConfigFromRequest(req);
    } catch {
      console.error('[api/attachments] failed to resolve instance');
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

    const writeRequest = req.method === 'POST' || req.method === 'DELETE';
    const accessAllowed = writeRequest
      ? await isAdminSessionAllowedForInstance({
          session,
          instance,
          requestHeaders: forwardedHeaders,
        })
      : await isReadSessionAllowedForInstance({
          session,
          instance,
          requestHeaders: forwardedHeaders,
        });
    if (!accessAllowed) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const project = await clientDataService.withRequestHeaders(forwardedHeaders, () =>
      clientDataService.withInstance(instance!.slug, () =>
        clientDataService.getProjectById(projectId)
      )
    );
    if (!project || String(project.id) !== projectId) {
      return res.status(404).json({ error: 'Project not found in this roadmap instance' });
    }

    const baseUrl = getInternalApiBaseUrl();

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
      if (forwardedHeaders.authorization) h.set('authorization', forwardedHeaders.authorization);
      if (forwardedHeaders.cookie) h.set('cookie', forwardedHeaders.cookie);
      try {
        h.set('origin', new URL(baseUrl).origin);
      } catch {
        /* baseUrl was already validated by URL construction below */
      }
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
      `${rootFolderUrl.replace(/\/$/, '')}/${encodeURIComponent(projectId)}`;

    const ensureProjectFolder = async (rootFolderUrl: string) => {
      const parent = rootFolderUrl.replace(/\/$/, '');
      const url = withSlug(
        `${baseUrl}/api/sharepoint/_api/web/GetFolderByServerRelativeUrl('${encodeServerRelativeUrl(parent)}')/Folders/add('${encodeURIComponent(
          projectId
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

    const writeFileMetadata = async (
      fileUrl: string,
      documentId: string,
      originalName: string
    ): Promise<void> => {
      const url = withSlug(
        `${baseUrl}/api/sharepoint/_api/web/GetFileByServerRelativeUrl('${encodeServerRelativeUrl(
          fileUrl
        )}')/ListItemAllFields`
      );
      const uploadedBy =
        session.displayName || session.entra?.upn || session.entra?.mail || session.username || '';
      const uploadedByOid = session.entra?.id || '';
      const availableFields = await clientDataService.withRequestHeaders(forwardedHeaders, () =>
        clientDataService.withInstance(instance!.slug, () =>
          clientDataService.getListFieldNames(storageTitle)
        )
      );
      const metadata: Record<string, string> = {};
      const candidates: Record<string, string> = {
        DocumentId: documentId,
        ProjectId: projectId,
        InstanceSlug: instance!.slug,
        OriginalFileName: originalName,
        UploadedAt: new Date().toISOString(),
        UploadedByOid: uploadedByOid,
        UploadedByName: uploadedBy,
      };
      for (const [field, value] of Object.entries(candidates)) {
        if (availableFields.has(field)) metadata[field] = value;
      }
      if (Object.keys(metadata).length === 0) return;
      const response = await fetch(url, {
        method: 'POST',
        headers: attachHeaders({
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/json;odata=nometadata',
          'X-HTTP-Method': 'MERGE',
          'IF-MATCH': '*',
        }),
        body: JSON.stringify(metadata),
      });
      if (!response.ok) {
        await response.body?.cancel().catch(() => undefined);
        console.warn('[api/attachments] file uploaded but metadata update failed', {
          status: response.status,
          projectId,
          documentId,
        });
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
          return res.status(atomResp.status).json({ error: 'SharePoint request failed' });
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
          return res
            .status(200)
            .json(items.map((item) => toAttachmentDocument(item.FileName, item.ServerRelativeUrl)));
        } catch {
          return res.status(200).json([]);
        }
      }

      if (!attempt.r.ok) {
        if (attempt.r.status === 404) return res.status(200).json([]);
        return res.status(attempt.r.status).json({ error: 'SharePoint request failed' });
      }

      const files = extractFileArray(attempt.payload, folderUrl);
      return res
        .status(200)
        .json(files.map((file) => toAttachmentDocument(file.FileName, file.ServerRelativeUrl)));
    }

    if (req.method === 'POST') {
      const originalName = validateAttachmentName(req.query.name);
      const totalSize = validateDeclaredSize(req.query.totalSize);

      const rootFolderUrl = await getRootFolderUrl();
      await ensureProjectFolder(rootFolderUrl);
      const projectFolderUrl = getProjectFolderUrl(rootFolderUrl);
      const folderPath = `${baseUrl}/api/sharepoint/_api/web/GetFolderByServerRelativeUrl('${encodeServerRelativeUrl(
        projectFolderUrl
      )}')`;

      const isChunked = String(req.query.chunked || '').toLowerCase() === '1';
      if (isChunked) {
        return res.status(400).json({
          error: 'Chunked uploads are disabled because files must be scanned before storage',
        });
      }

      const binary = await readRawBody(req, totalSize);
      if (binary.byteLength !== totalSize) {
        return res.status(400).json({ error: 'Upload size does not match declared file size' });
      }
      validateInitialFileContent(originalName, binary);
      await scanBufferForMalware(binary);
      const documentId = randomUUID();
      const storageName = buildStorageFileName(documentId, originalName);
      const fileUrl = fileUrlFor(rootFolderUrl, storageName);
      const addUrl = withSlug(
        `${folderPath}/Files/add(url='${encodeURIComponent(storageName).replace(/'/g, "''")}',overwrite=false)`
      );
      const r = await fetch(addUrl, {
        method: 'POST',
        headers: attachHeaders({
          Accept: 'application/json;odata=nometadata',
          'Content-Type': 'application/octet-stream',
        }),
        body: toArrayBuffer(binary),
      });
      await r.body?.cancel().catch(() => undefined);
      if (!r.ok) return res.status(r.status).json({ error: 'SharePoint upload failed' });
      await writeFileMetadata(fileUrl, documentId, originalName);
      return res.status(200).json({
        ok: true,
        document: toAttachmentDocument(storageName, fileUrl),
      });
    }

    if (req.method === 'DELETE') {
      const documentId = validateDocumentId(req.query.documentId ?? req.query.name);
      const rootFolderUrl = await getRootFolderUrl();
      const folderUrl = getProjectFolderUrl(rootFolderUrl);
      const listUrl = withSlug(
        `${baseUrl}/api/sharepoint/_api/web/GetFolderByServerRelativeUrl('${encodeServerRelativeUrl(
          folderUrl
        )}')/Files?$select=Name,ServerRelativeUrl`
      );
      let listResponse = await fetch(listUrl, {
        headers: attachHeaders({ Accept: 'application/json;odata=nometadata' }),
      });
      let listText = await listResponse.text();
      if (!listResponse.ok && shouldRetryAsLegacy(listResponse.status, listText)) {
        listResponse = await fetch(listUrl, {
          headers: attachHeaders({ Accept: 'application/json;odata=verbose' }),
        });
        listText = await listResponse.text();
      }
      if (!listResponse.ok) {
        return res.status(listResponse.status).json({ error: 'sp-list-failed' });
      }
      const listPayload = extractJsonPayload(
        listText,
        listResponse.headers.get('content-type') || ''
      );
      const files = extractFileArray(listPayload, folderUrl);
      const match = files.find(
        (file) =>
          toAttachmentDocument(file.FileName, file.ServerRelativeUrl).DocumentId === documentId
      );
      if (!match) return res.status(404).json({ error: 'Document not found in this project' });
      await deleteFile(rootFolderUrl, match.FileName);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET,POST,DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: unknown) {
    if (error instanceof AttachmentValidationError) {
      return res.status(error.status).json({ error: error.message });
    }
    if (error instanceof MalwareScanError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('[api/attachments] request failed', {
      type: error instanceof Error ? error.name : 'UnknownError',
    });
    return res.status(500).json({ error: 'Attachment request failed' });
  }
}
