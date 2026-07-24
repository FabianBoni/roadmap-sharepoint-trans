import { extname } from 'path';

export const DEFAULT_ATTACHMENT_MAX_BYTES = 25 * 1024 * 1024;
export const MAX_ATTACHMENT_CHUNK_BYTES = 2 * 1024 * 1024;
export const MAX_ATTACHMENT_NAME_LENGTH = 180;

const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.png',
  '.jpg',
  '.jpeg',
  '.txt',
  '.csv',
  '.zip',
]);

const DOCUMENT_ID_PREFIX =
  /^(?<documentId>[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})__(?<name>.+)$/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AttachmentDocument = {
  DocumentId: string;
  FileName: string;
  ServerRelativeUrl: string;
};

export class AttachmentValidationError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message);
    this.name = 'AttachmentValidationError';
  }
}

export const getAttachmentMaxBytes = (): number => {
  const parsed = Number.parseInt(String(process.env.ROADMAP_DOCUMENT_MAX_BYTES || ''), 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : DEFAULT_ATTACHMENT_MAX_BYTES;
};

export const validateProjectId = (value: unknown): string => {
  const id = typeof value === 'string' ? value.trim() : '';
  if (!/^[1-9]\d*$/.test(id)) {
    throw new AttachmentValidationError('Invalid project ID');
  }
  return id;
};

export const validateDocumentId = (value: unknown): string => {
  const id = typeof value === 'string' ? value.trim() : '';
  if (!id || id.length > 255 || /[\\/\u0000-\u001f\u007f]/.test(id) || id === '.' || id === '..') {
    throw new AttachmentValidationError('Invalid document ID');
  }
  return id;
};

export const validateUploadId = (value: unknown): string => {
  const id = typeof value === 'string' ? value.trim() : '';
  if (!UUID.test(id)) throw new AttachmentValidationError('Invalid upload ID');
  return id;
};

export const validateAttachmentName = (value: unknown): string => {
  const name = typeof value === 'string' ? value.normalize('NFC').trim() : '';
  if (!name) throw new AttachmentValidationError('Missing file name');
  if (name.length > MAX_ATTACHMENT_NAME_LENGTH) {
    throw new AttachmentValidationError(
      `File name is too long (max. ${MAX_ATTACHMENT_NAME_LENGTH} characters)`
    );
  }
  if (
    name === '.' ||
    name === '..' ||
    /[\\/~"#%&*:<>?{|}\u0000-\u001f\u007f]/.test(name) ||
    /[. ]$/.test(name)
  ) {
    throw new AttachmentValidationError('File name contains unsupported characters');
  }
  const extension = extname(name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new AttachmentValidationError('File type is not allowed', 415);
  }
  return name;
};

export const validateDeclaredSize = (value: unknown): number => {
  const size = Number(value);
  const maxBytes = getAttachmentMaxBytes();
  if (!Number.isSafeInteger(size) || size <= 0) {
    throw new AttachmentValidationError('Invalid or missing file size');
  }
  if (size > maxBytes) {
    throw new AttachmentValidationError(`File is too large (max. ${maxBytes} bytes)`, 413);
  }
  return size;
};

const startsWith = (bytes: Uint8Array, signature: number[]): boolean =>
  signature.every((value, index) => bytes[index] === value);

export const validateInitialFileContent = (fileName: string, bytes: Uint8Array): void => {
  if (bytes.byteLength === 0) throw new AttachmentValidationError('Empty files are not allowed');
  const extension = extname(fileName).toLowerCase();
  const isZip = startsWith(bytes, [0x50, 0x4b]);
  const isCompoundOffice = startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0]);

  const valid = (() => {
    if (extension === '.pdf') return startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]);
    if (extension === '.png')
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (extension === '.jpg' || extension === '.jpeg') return startsWith(bytes, [0xff, 0xd8, 0xff]);
    if (['.docx', '.xlsx', '.pptx', '.zip'].includes(extension)) return isZip;
    if (['.doc', '.xls', '.ppt'].includes(extension)) return isCompoundOffice;
    if (extension === '.txt' || extension === '.csv') {
      const sample = bytes.subarray(0, Math.min(bytes.byteLength, 8192));
      return !sample.some((byte) => byte === 0);
    }
    return false;
  })();

  if (!valid) {
    throw new AttachmentValidationError('File content does not match the file type', 415);
  }
};

export const buildStorageFileName = (documentId: string, originalName: string): string =>
  `${validateUploadId(documentId)}__${validateAttachmentName(originalName)}`;

export const parseStorageFileName = (
  storageName: string
): {
  documentId: string;
  originalName: string;
} => {
  const match = DOCUMENT_ID_PREFIX.exec(storageName);
  if (!match?.groups?.documentId || !match.groups.name) {
    return { documentId: storageName, originalName: storageName };
  }
  return { documentId: match.groups.documentId, originalName: match.groups.name };
};

export const toAttachmentDocument = (
  storageName: string,
  serverRelativeUrl: string
): AttachmentDocument => {
  const parsed = parseStorageFileName(storageName);
  return {
    DocumentId: parsed.documentId,
    FileName: parsed.originalName,
    ServerRelativeUrl: serverRelativeUrl,
  };
};
