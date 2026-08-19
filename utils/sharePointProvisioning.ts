import { clientDataService } from '@/utils/clientDataService';
import type {
  RoadmapInstanceConfig,
  RoadmapInstanceHealth,
  RoadmapInstanceHealthStatus,
} from '@/types/roadmapInstance';
import { resolveSharePointSiteUrl } from '@/utils/sharepointEnv';
import { normalizeSharePointStrategy } from '@/utils/sharePointStrategy';
import type { SharePointFieldDefinition, SharePointListDefinition } from '@/utils/sharePointLists';
import { SHAREPOINT_LIST_DEFINITIONS, encodeSharePointValue } from '@/utils/sharePointLists';

const verboseHeaders = (digest: string) => ({
  Accept: 'application/json;odata=verbose',
  'Content-Type': 'application/json;odata=verbose',
  'X-RequestDigest': digest,
});

const jsonHeaders = {
  Accept: 'application/json;odata=nometadata',
};

const probeCompatibility = async (health: RoadmapInstanceHealth) => {
  try {
    const resp = await clientDataService.sharePointFetch(
      '/api/sharepoint/_api/web?$select=Title,Url,WebTemplate,WebTemplateConfiguration',
      { headers: jsonHeaders }
    );
    if (!resp.ok) {
      const message = await readError(resp);
      health.compatibility = {
        status: 'error',
        errors: [message],
      };
      return;
    }

    const data = (await resp.json().catch(() => null)) as unknown;
    const obj = unwrapODataEntity(data);
    const msts = resp.headers.get('microsoftsharepointteamservices') ?? undefined;
    const webTitle = typeof obj.Title === 'string' ? obj.Title : undefined;
    const webUrl = typeof obj.Url === 'string' ? obj.Url : undefined;
    const webTemplate = typeof obj.WebTemplate === 'string' ? obj.WebTemplate : undefined;
    const webTemplateConfiguration =
      typeof obj.WebTemplateConfiguration === 'number' ? obj.WebTemplateConfiguration : undefined;

    const warnings: string[] = [];
    if (!msts)
      warnings.push('Header "MicrosoftSharePointTeamServices" fehlt (Version nicht erkennbar)');

    const status: RoadmapInstanceHealthStatus = 'ok';
    health.compatibility = {
      status,
      sharePointTeamServices: msts,
      webTitle,
      webUrl,
      webTemplate,
      webTemplateConfiguration,
      warnings: warnings.length ? warnings : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    health.compatibility = { status: 'error', errors: [message] };
  }
};

const getListCandidates = (def: SharePointListDefinition): string[] => {
  const candidates = [def.title, def.key, ...(def.aliases ?? [])].filter(Boolean);
  return Array.from(new Set(candidates.map((value) => value.trim()))).filter(Boolean);
};

const LIST_INFO_SELECT =
  '?$select=Title,Id,ItemCount,Created,LastItemModifiedDate,DefaultViewUrl,RootFolder/ServerRelativeUrl&$expand=RootFolder';

export type SharePointListOverviewEntry = {
  key: string;
  title: string;
  exists: boolean;
  resolvedTitle?: string;
  matchedAlias?: string;
  itemCount?: number;
  created?: string;
  modified?: string;
  defaultViewUrl?: string;
  serverRelativeUrl?: string;
  errors?: string[];
};

export type SharePointListEnsureResult = {
  key: string;
  title: string;
  resolvedTitle: string;
  lists: RoadmapInstanceHealth['lists'];
};

export type SharePointListDeleteResult = {
  key: string;
  title: string;
  resolvedTitle?: string;
  status: 'deleted' | 'missing';
  errors?: string[];
};

const readError = async (resp: Response): Promise<string> => {
  try {
    const text = await resp.text();
    return text.slice(0, 500);
  } catch (error) {
    return error instanceof Error ? error.message : 'Unbekannter Fehler';
  }
};

const decodeDeletedFieldsXml = (raw: string): string => {
  if (!raw || typeof raw !== 'string') return '';
  return raw
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/g, "'")
    .replace(/&#x0d;/gi, '')
    .replace(/&#x0a;/gi, '\n');
};

const deletedFieldRegex = /gelöscht|deleted/i;

const shouldAttemptDeletedFieldCleanup = (errorMessage: string | null | undefined): boolean =>
  Boolean(errorMessage && deletedFieldRegex.test(errorMessage));

const extractDeletedFieldId = (xml: string, fieldName: string): string | null => {
  if (!xml) return null;
  const nameRegex = new RegExp(`<Field[^>]*Name="?${fieldName}"?[^>]*>`, 'i');
  const match = xml.match(nameRegex);
  if (!match) return null;
  const fieldTag = match[0];
  const idMatch = fieldTag.match(/ID=["']?({[^"'}]+}|[^"']+)/i);
  if (!idMatch) return null;
  const rawId = idMatch[1];
  return rawId.replace(/[{}]/g, '').trim();
};

const removeDeletedFieldIfPresent = async (
  listTitle: string,
  fieldName: string,
  digest: string
): Promise<boolean> => {
  try {
    const encodedList = encodeSharePointValue(listTitle);
    const propsResp = await clientDataService.sharePointFetch(
      `/api/sharepoint/_api/web/lists/getByTitle('${encodedList}')/RootFolder/Properties?$select=vti_x005f_deletedfields`,
      { headers: verboseHeaders(digest) }
    );
    if (!propsResp.ok) return false;
    const propsData = await propsResp.json();
    const raw =
      propsData?.vti_x005f_deletedfields ??
      propsData?.d?.vti_x005f_deletedfields?.__text ??
      propsData?.d?.vti_x005f_deletedfields ??
      '';
    if (typeof raw !== 'string' || raw.length === 0) return false;
    const xml = decodeDeletedFieldsXml(raw);
    const fieldId = extractDeletedFieldId(xml, fieldName);
    if (!fieldId) return false;
    const deleteResp = await clientDataService.sharePointFetch(
      `/api/sharepoint/_api/web/lists/getByTitle('${encodedList}')/fields(guid'${fieldId}')`,
      {
        method: 'POST',
        headers: {
          ...verboseHeaders(digest),
          'X-HTTP-Method': 'DELETE',
          'IF-MATCH': '*',
        },
      }
    );
    if (!deleteResp.ok) {
      const message = await readError(deleteResp);
      console.warn(
        `[sharePointProvisioning] Failed to purge deleted field ${fieldName} (${fieldId}):`,
        message
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn(
      `[sharePointProvisioning] Exception while attempting to purge deleted field ${fieldName}`,
      error
    );
    return false;
  }
};

type SharePointFieldSnapshot = {
  internalName: string;
  title: string;
  type: string;
  schemaAttributes: Record<string, string>;
  values: Record<string, unknown>;
};

const FIELD_SELECT =
  '?$select=InternalName,Title,TypeAsString,Required,Hidden,ReadOnlyField,Indexed,EnforceUniqueValues,Description,DefaultValue,SchemaXml';

const unwrapODataEntity = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const root = value as Record<string, unknown>;
  if (Array.isArray(root.value)) {
    const first = root.value[0];
    return first && typeof first === 'object' && !Array.isArray(first)
      ? (first as Record<string, unknown>)
      : {};
  }
  const d = root.d;
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    const dRecord = d as Record<string, unknown>;
    if (Array.isArray(dRecord.results)) {
      const first = dRecord.results[0];
      return first && typeof first === 'object' && !Array.isArray(first)
        ? (first as Record<string, unknown>)
        : {};
    }
    return dRecord;
  }
  return root;
};

const parseSchemaAttributes = (schemaXml: unknown): Record<string, string> => {
  if (typeof schemaXml !== 'string') return {};
  const attributes: Record<string, string> = {};
  const pattern = /([A-Za-z][A-Za-z0-9_.:-]*)\s*=\s*(["'])([\s\S]*?)\2/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(schemaXml))) attributes[match[1].toLowerCase()] = match[3];
  return attributes;
};

const normalizeBoolean = (value: unknown): boolean =>
  value === true || value === 1 || /^(true|1)$/i.test(String(value ?? '').trim());

const normalizeNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || String(value).trim() === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const readFieldSnapshot = async (
  listTitle: string,
  fieldName: string
): Promise<{ response: Response; snapshot?: SharePointFieldSnapshot }> => {
  const encodedList = encodeSharePointValue(listTitle);
  const encodedField = encodeSharePointValue(fieldName);
  const response = await clientDataService.sharePointFetch(
    `/api/sharepoint/_api/web/lists/getByTitle('${encodedList}')/fields/getByInternalNameOrTitle('${encodedField}')${FIELD_SELECT}`,
    { headers: jsonHeaders }
  );
  if (!response.ok) return { response };
  const entity = unwrapODataEntity(await response.json());
  return {
    response,
    snapshot: {
      internalName: String(entity.InternalName || fieldName),
      title: String(entity.Title || entity.InternalName || fieldName),
      type: String(entity.TypeAsString || ''),
      schemaAttributes: parseSchemaAttributes(entity.SchemaXml),
      values: entity,
    },
  };
};

const desiredFieldState = (field: SharePointFieldDefinition) => {
  const attributes = parseSchemaAttributes(field.schemaXml);
  return {
    attributes,
    title: attributes.displayname || field.name,
    type: attributes.type || '',
  };
};

const getFieldDifferences = (
  field: SharePointFieldDefinition,
  snapshot: SharePointFieldSnapshot
): string[] => {
  const desired = desiredFieldState(field);
  const current = snapshot.schemaAttributes;
  const differences: string[] = [];
  const currentString = (attribute: string, property?: string): string => {
    const propertyValue = property ? snapshot.values[property] : undefined;
    if (propertyValue !== undefined && propertyValue !== null) return String(propertyValue);
    return current[attribute] || '';
  };
  const compareBoolean = (attribute: string, property: string) => {
    const expected = normalizeBoolean(desired.attributes[attribute]);
    if (normalizeBoolean(currentString(attribute, property)) !== expected)
      differences.push(attribute);
  };
  const compareOptionalNumber = (attribute: string, property?: string) => {
    if (desired.attributes[attribute] === undefined) return;
    if (
      normalizeNumber(currentString(attribute, property)) !==
      normalizeNumber(desired.attributes[attribute])
    ) {
      differences.push(attribute);
    }
  };

  if (snapshot.type.toLowerCase() !== desired.type.toLowerCase()) differences.push('type');
  if (snapshot.title !== desired.title) differences.push('title');
  compareBoolean('required', 'Required');
  compareBoolean('hidden', 'Hidden');
  compareBoolean('readonly', 'ReadOnlyField');
  compareBoolean('indexed', 'Indexed');
  compareBoolean('enforceuniquevalues', 'EnforceUniqueValues');
  compareOptionalNumber('maxlength', 'MaxLength');
  compareOptionalNumber('numlines', 'NumberOfLines');
  compareOptionalNumber('minvalue', 'MinimumValue');
  compareOptionalNumber('maxvalue', 'MaximumValue');
  if (
    desired.attributes.richtext !== undefined &&
    normalizeBoolean(currentString('richtext', 'RichText')) !==
      normalizeBoolean(desired.attributes.richtext)
  ) {
    differences.push('richtext');
  }
  if (
    desired.attributes.format !== undefined &&
    currentString('format').toLowerCase() !== desired.attributes.format.toLowerCase()
  ) {
    differences.push('format');
  }
  return Array.from(new Set(differences));
};

const fieldMetadataType = (type: string): string => {
  const normalized = type.toLowerCase();
  if (normalized === 'text') return 'SP.FieldText';
  if (normalized === 'note') return 'SP.FieldMultiLineText';
  if (normalized === 'number') return 'SP.FieldNumber';
  if (normalized === 'datetime') return 'SP.FieldDateTime';
  if (normalized === 'boolean') return 'SP.FieldBoolean';
  if (normalized === 'url') return 'SP.FieldUrl';
  return 'SP.Field';
};

const buildFieldUpdatePayload = (
  field: SharePointFieldDefinition,
  differences: string[]
): Record<string, unknown> => {
  const desired = desiredFieldState(field);
  const attrs = desired.attributes;
  const include = (name: string) => differences.includes(name);
  const payload: Record<string, unknown> = {
    __metadata: { type: fieldMetadataType(desired.type) },
  };
  if (include('title')) payload.Title = desired.title;
  if (include('required')) payload.Required = normalizeBoolean(attrs.required);
  if (include('hidden')) payload.Hidden = normalizeBoolean(attrs.hidden);
  if (include('readonly')) payload.ReadOnlyField = normalizeBoolean(attrs.readonly);
  if (include('indexed')) payload.Indexed = normalizeBoolean(attrs.indexed);
  if (include('enforceuniquevalues')) {
    payload.EnforceUniqueValues = normalizeBoolean(attrs.enforceuniquevalues);
  }
  if (include('maxlength')) payload.MaxLength = normalizeNumber(attrs.maxlength);
  if (include('numlines')) payload.NumberOfLines = normalizeNumber(attrs.numlines);
  if (include('richtext')) payload.RichText = normalizeBoolean(attrs.richtext);
  if (include('minvalue')) payload.MinimumValue = normalizeNumber(attrs.minvalue);
  if (include('maxvalue')) payload.MaximumValue = normalizeNumber(attrs.maxvalue);
  if (include('format')) {
    if (desired.type.toLowerCase() === 'datetime') {
      payload.DisplayFormat = attrs.format.toLowerCase() === 'dateonly' ? 0 : 1;
    } else if (desired.type.toLowerCase() === 'url') {
      payload.DisplayFormat = attrs.format.toLowerCase() === 'image' ? 1 : 0;
    }
  }
  return payload;
};

const markFieldUpdated = (health: RoadmapInstanceHealth, listTitle: string, fieldName: string) => {
  if (!health.lists.fieldsUpdated) health.lists.fieldsUpdated = {};
  const updated = health.lists.fieldsUpdated[listTitle] || [];
  if (!updated.includes(fieldName)) updated.push(fieldName);
  health.lists.fieldsUpdated[listTitle] = updated;
};

const reconcileExistingField = async (
  listTitle: string,
  field: SharePointFieldDefinition,
  digest: string,
  health: RoadmapInstanceHealth,
  snapshot: SharePointFieldSnapshot
) => {
  const differences = getFieldDifferences(field, snapshot);
  if (differences.length === 0) return;
  const errorKey = `${listTitle}.${field.name}`;
  if (differences.includes('type')) {
    health.lists.errors[errorKey] =
      `Inkompatibler Spaltentyp: erwartet ${desiredFieldState(field).type}, vorhanden ${snapshot.type}. ` +
      'Die Spalte wurde zum Schutz bestehender Daten nicht automatisch gelöscht.';
    return;
  }

  const encodedList = encodeSharePointValue(listTitle);
  const encodedField = encodeSharePointValue(snapshot.internalName || field.name);
  const endpoint = `/api/sharepoint/_api/web/lists/getByTitle('${encodedList}')/fields/getByInternalNameOrTitle('${encodedField}')`;
  const updateResponse = await clientDataService.sharePointFetch(endpoint, {
    method: 'POST',
    headers: {
      ...verboseHeaders(digest),
      'X-HTTP-Method': 'MERGE',
      'IF-MATCH': '*',
    },
    body: JSON.stringify(buildFieldUpdatePayload(field, differences)),
  });
  if (!updateResponse.ok) {
    const message = await readError(updateResponse);
    if (isAuthStatus(updateResponse.status)) {
      const context = `field:update ${listTitle}.${field.name}`;
      recordAuthFailure(health, updateResponse.status, message, { context });
      throw new SharePointAuthError(updateResponse.status, message, context);
    }
    health.lists.errors[errorKey] = `Spaltenabgleich fehlgeschlagen: ${message}`;
    return;
  }

  clientDataService.invalidateListSchemaCache(listTitle);
  const verified = await readFieldSnapshot(listTitle, field.name);
  if (!verified.response.ok || !verified.snapshot) {
    health.lists.errors[errorKey] = verified.response.ok
      ? 'Spaltenabgleich konnte nicht verifiziert werden.'
      : `Spaltenabgleich konnte nicht verifiziert werden: ${await readError(verified.response)}`;
    return;
  }
  const remaining = getFieldDifferences(field, verified.snapshot);
  if (remaining.length > 0) {
    health.lists.errors[errorKey] =
      `Spaltenabgleich unvollständig; weiterhin abweichend: ${remaining.join(', ')}`;
    return;
  }
  markFieldUpdated(health, listTitle, field.name);
};

const ensureField = async (
  listTitle: string,
  field: SharePointFieldDefinition,
  digest: string,
  health: RoadmapInstanceHealth
) => {
  const initial = await readFieldSnapshot(listTitle, field.name);
  if (initial.response.ok && initial.snapshot) {
    await reconcileExistingField(listTitle, field, digest, health, initial.snapshot);
    return;
  }
  if (isAuthStatus(initial.response.status)) {
    const message = await readError(initial.response);
    const context = `field:check ${listTitle}.${field.name}`;
    recordAuthFailure(health, initial.response.status, message, { context });
    throw new SharePointAuthError(initial.response.status, message, context);
  }
  const initialError = initial.response.status === 404 ? null : await readError(initial.response);
  const canCreate =
    initial.response.status === 404 ||
    Boolean(
      initialError &&
      /InvalidClientQuery|Invalid argument|does not exist|PropertyNotFound|Could not find a property named|is not present|wurde sie von einem anderen Benutzer gelöscht/i.test(
        initialError
      )
    );
  if (!canCreate) {
    health.lists.errors[`${listTitle}.${field.name}`] =
      initialError || 'Spaltenprüfung fehlgeschlagen';
    return;
  }

  await removeDeletedFieldIfPresent(listTitle, field.name, digest);
  const encodedList = encodeSharePointValue(listTitle);
  const endpoint = `/api/sharepoint/_api/web/lists/getByTitle('${encodedList}')/fields/CreateFieldAsXml`;
  const bodies = [
    JSON.stringify({
      parameters: {
        __metadata: { type: 'SP.XmlSchemaFieldCreationInformation' },
        SchemaXml: field.schemaXml,
        Options: 0,
      },
    }),
    JSON.stringify({
      __metadata: { type: 'SP.XmlSchemaFieldCreationInformation' },
      SchemaXml: field.schemaXml,
      Options: 0,
    }),
  ];
  const errors: string[] = [];
  for (const body of bodies) {
    const response = await clientDataService.sharePointFetch(endpoint, {
      method: 'POST',
      headers: verboseHeaders(digest),
      body,
    });
    if (response.ok) {
      clientDataService.invalidateListSchemaCache(listTitle);
      const created = health.lists.fieldsCreated[listTitle] || [];
      if (!created.includes(field.name)) created.push(field.name);
      health.lists.fieldsCreated[listTitle] = created;
      return;
    }
    if (isAuthStatus(response.status)) {
      const message = await readError(response);
      const context = `field:create ${listTitle}.${field.name}`;
      recordAuthFailure(health, response.status, message, { context });
      throw new SharePointAuthError(response.status, message, context);
    }
    const message = await readError(response);
    errors.push(message);

    // A concurrent provisioner may have created the field after our initial check.
    const raced = await readFieldSnapshot(listTitle, field.name);
    if (raced.response.ok && raced.snapshot) {
      await reconcileExistingField(listTitle, field, digest, health, raced.snapshot);
      return;
    }
    if (shouldAttemptDeletedFieldCleanup(message)) {
      await removeDeletedFieldIfPresent(listTitle, field.name, digest);
    }
  }
  health.lists.errors[`${listTitle}.${field.name}`] = errors.join('\n').trim();
};

const extractFieldTypeFromSchema = (schemaXml: string): string => {
  if (!schemaXml) return '';
  const match = schemaXml.match(/Type="([^"]+)"/i) || schemaXml.match(/Type='([^']+)'/i);
  return match?.[1] ? match[1].trim() : '';
};

const validateListSchema = async (
  def: SharePointListDefinition,
  resolvedTitle: string,
  health: RoadmapInstanceHealth
) => {
  try {
    const fieldNames = await clientDataService.getListFieldNames(resolvedTitle);
    const fieldTypes = await clientDataService.getListFieldTypes(resolvedTitle);
    const expected = def.fields.map((f) => ({
      name: f.name,
      expectedType: extractFieldTypeFromSchema(f.schemaXml),
    }));
    const missing = expected.filter((f) => !fieldNames.has(f.name)).map((f) => f.name);
    const typeMismatches = expected
      .filter((f) => fieldNames.has(f.name))
      .map((f) => {
        const actual = String(fieldTypes[f.name] || '').trim();
        return {
          field: f.name,
          expected: f.expectedType || '(unspecified)',
          actual: actual || '(unknown)',
        };
      })
      .filter(
        (entry) =>
          entry.expected &&
          entry.actual &&
          entry.expected.toLowerCase() !== entry.actual.toLowerCase()
      );
    // SharePoint templates contain many built-in fields. Additional fields are harmless and
    // cannot be classified reliably without loading their base-field metadata, so health only
    // reports missing or incompatible fields from our authoritative definition.
    const unexpected: string[] = [];

    if (!health.lists.schemaMismatches) health.lists.schemaMismatches = {};
    const hasIssues = missing.length || typeMismatches.length || unexpected.length;
    if (hasIssues) {
      health.lists.schemaMismatches[resolvedTitle] = { missing, unexpected, typeMismatches };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Schema-Validierung fehlgeschlagen';
    if (!health.lists.errors) health.lists.errors = {};
    health.lists.errors[`schema:${resolvedTitle}`] = message;
  }
};

class SharePointAuthError extends Error {
  public readonly status: number;
  public readonly context?: string;
  constructor(status: number, message: string, context?: string) {
    super(message);
    this.status = status;
    this.context = context;
    this.name = 'SharePointAuthError';
  }
}

const isAuthStatus = (status: number) => status === 401 || status === 403;

const recordAuthFailure = (
  health: RoadmapInstanceHealth,
  status: number,
  message: string,
  meta?: { siteUrl?: string; strategy?: string; context?: string }
) => {
  const normalized = typeof message === 'string' ? message.trim() : '';
  const safeMessage = normalized || (status === 401 ? 'Unauthorized' : 'Forbidden');
  const extraParts = [
    meta?.context ? `op=${meta.context}` : null,
    meta?.strategy ? `strategy=${meta.strategy}` : null,
    meta?.siteUrl ? `site=${meta.siteUrl}` : null,
  ].filter(Boolean);
  const suffix = extraParts.length ? ` (${extraParts.join(', ')})` : '';
  health.permissions = {
    status: 'error',
    message: `SharePoint Auth-Fehler (${status}): ${safeMessage}${suffix}`,
  };
  if (!health.lists.errors) health.lists.errors = {};
  health.lists.errors.__auth = `(${status}) ${safeMessage}${suffix}`;
  if (meta?.context) health.lists.errors.__authOp = meta.context;
  if (meta?.strategy) health.lists.errors.__authStrategy = meta.strategy;
  if (meta?.siteUrl) health.lists.errors.__authSite = meta.siteUrl;
};

const ensureList = async (
  def: SharePointListDefinition,
  digest: string,
  health: RoadmapInstanceHealth
): Promise<string | null> => {
  const candidates = getListCandidates(def);
  let resolved: string | null = null;
  let checkFailed = false;

  for (const candidate of candidates) {
    const check = await clientDataService.sharePointFetch(
      `/api/sharepoint/_api/web/lists/getByTitle('${encodeSharePointValue(candidate)}')?$select=Id`,
      { headers: jsonHeaders }
    );
    if (check.ok) {
      resolved = candidate;
      if (!health.lists.ensured.includes(candidate)) {
        health.lists.ensured.push(candidate);
      }
      break;
    }

    if (isAuthStatus(check.status)) {
      const message = await readError(check);
      const ctx = `list:check ${candidate}`;
      recordAuthFailure(health, check.status, message, { context: ctx });
      throw new SharePointAuthError(check.status, message, ctx);
    }

    if (check.status !== 404) {
      const message = await readError(check);
      health.lists.errors[candidate] = message;
      checkFailed = true;
    }
  }

  if (!resolved && checkFailed) return null;

  if (!resolved) {
    const createResp = await clientDataService.sharePointFetch(`/api/sharepoint/_api/web/lists`, {
      method: 'POST',
      headers: verboseHeaders(digest),
      body: JSON.stringify({
        __metadata: { type: 'SP.List' },
        AllowContentTypes: true,
        BaseTemplate: def.template,
        ContentTypesEnabled: true,
        Description: def.description || def.title,
        Title: def.title,
      }),
    });
    if (!createResp.ok) {
      const message = await readError(createResp);
      if (isAuthStatus(createResp.status)) {
        const ctx = `list:create ${def.title}`;
        recordAuthFailure(health, createResp.status, message, { context: ctx });
        throw new SharePointAuthError(createResp.status, message, ctx);
      }
      // A concurrent request may have created the list after our checks.
      for (const candidate of candidates) {
        const raced = await clientDataService.sharePointFetch(
          `/api/sharepoint/_api/web/lists/getByTitle('${encodeSharePointValue(candidate)}')?$select=Id`,
          { headers: jsonHeaders }
        );
        if (raced.ok) {
          resolved = candidate;
          if (!health.lists.ensured.includes(candidate)) health.lists.ensured.push(candidate);
          break;
        }
      }
      if (!resolved) {
        health.lists.errors[def.title] = message;
        return null;
      }
    } else {
      health.lists.created.push(def.title);
      resolved = def.title;
    }
  }

  clientDataService.invalidateListSchemaCache(resolved);
  for (const field of def.fields) {
    await ensureField(resolved, field, digest, health);
  }

  return resolved;
};

const deleteListByTitle = async (title: string, digest: string) => {
  const response = await clientDataService.sharePointFetch(
    `/api/sharepoint/_api/web/lists/getByTitle('${encodeSharePointValue(title)}')`,
    {
      method: 'POST',
      headers: {
        ...verboseHeaders(digest),
        'X-HTTP-Method': 'DELETE',
        'IF-MATCH': '*',
      },
    }
  );
  if (!response.ok) {
    throw new Error(
      `SharePoint-Liste "${title}" konnte nicht gelöscht werden: ${await readError(response)}`
    );
  }
  clientDataService.invalidateListSchemaCache(title);
};

const probePermissions = async (
  digest: string
): Promise<{
  status: RoadmapInstanceHealthStatus;
  message?: string;
  probeList?: string;
}> => {
  const probeList = `RoadmapHealthProbe_${Date.now().toString(36)}`;
  const payload = {
    __metadata: { type: 'SP.List' },
    AllowContentTypes: false,
    BaseTemplate: 100,
    ContentTypesEnabled: false,
    Description: 'Roadmap health permission probe',
    Title: probeList,
  };

  let status: RoadmapInstanceHealthStatus = 'unknown';
  let message: string | undefined;
  let created = false;

  try {
    const createResp = await clientDataService.sharePointFetch(`/api/sharepoint/_api/web/lists`, {
      method: 'POST',
      headers: verboseHeaders(digest),
      body: JSON.stringify(payload),
    });
    if (!createResp.ok) {
      message = await readError(createResp);
      status = createResp.status === 403 ? 'insufficient' : 'error';
    } else {
      created = true;
      status = 'ok';
    }
  } catch (error) {
    status = 'error';
    message = error instanceof Error ? error.message : 'Unbekannter Fehler';
  } finally {
    if (created) {
      try {
        await deleteListByTitle(probeList, digest);
      } catch (error) {
        status = 'error';
        message =
          error instanceof Error
            ? error.message
            : 'Temporäre Prüfliste konnte nicht gelöscht werden';
        console.warn('[sharePointProvisioning] Failed to delete probe list');
      }
    }
  }
  return { status, message, probeList };
};

const provisioningLocks = new Map<string, Promise<void>>();

const withProvisioningLock = async <T>(slug: string, operation: () => Promise<T>): Promise<T> => {
  const previous = provisioningLocks.get(slug) ?? Promise.resolve();
  let release = () => undefined;
  const current = new Promise<void>((resolve) => {
    release = resolve;
  });
  provisioningLocks.set(slug, current);
  await previous.catch(() => undefined);
  try {
    return await operation();
  } finally {
    release();
    if (provisioningLocks.get(slug) === current) provisioningLocks.delete(slug);
  }
};

export async function getSharePointListOverview(
  instance: RoadmapInstanceConfig
): Promise<SharePointListOverviewEntry[]> {
  const overview: SharePointListOverviewEntry[] = [];
  await clientDataService.withInstance(instance.slug, async () => {
    for (const def of SHAREPOINT_LIST_DEFINITIONS) {
      const entry: SharePointListOverviewEntry = {
        key: def.key,
        title: def.title,
        exists: false,
      };
      const errors: string[] = [];
      const candidates = getListCandidates(def);
      for (const candidate of candidates) {
        const resp = await clientDataService.sharePointFetch(
          `/api/sharepoint/_api/web/lists/getByTitle('${encodeSharePointValue(candidate)}')${LIST_INFO_SELECT}`,
          { headers: jsonHeaders }
        );
        if (resp.ok) {
          const data = unwrapODataEntity(await resp.json());
          entry.exists = true;
          entry.resolvedTitle = typeof data.Title === 'string' ? data.Title : candidate;
          entry.matchedAlias = candidate;
          const itemCount = Number(data.ItemCount);
          if (Number.isFinite(itemCount)) entry.itemCount = itemCount;
          if (typeof data.Created === 'string') entry.created = data.Created;
          if (typeof data.LastItemModifiedDate === 'string') {
            entry.modified = data.LastItemModifiedDate;
          }
          if (typeof data.DefaultViewUrl === 'string') entry.defaultViewUrl = data.DefaultViewUrl;
          const rootFolder = data.RootFolder;
          if (
            rootFolder &&
            typeof rootFolder === 'object' &&
            !Array.isArray(rootFolder) &&
            typeof (rootFolder as Record<string, unknown>).ServerRelativeUrl === 'string'
          ) {
            entry.serverRelativeUrl = String(
              (rootFolder as Record<string, unknown>).ServerRelativeUrl
            );
          }
          break;
        }
        if (resp.status !== 404) {
          const message = await readError(resp);
          errors.push(`${candidate}: ${message}`);
        }
      }
      if (!entry.exists && errors.length > 0) {
        entry.errors = errors;
      }
      overview.push(entry);
    }
  });
  return overview;
}

async function ensureSharePointListForInstanceUnlocked(
  instance: RoadmapInstanceConfig,
  key: string
): Promise<SharePointListEnsureResult> {
  const def = SHAREPOINT_LIST_DEFINITIONS.find((candidate) => candidate.key === key);
  if (!def) {
    throw new Error(`Unbekannter Listen-Schlüssel "${key}"`);
  }

  const health: RoadmapInstanceHealth = {
    checkedAt: new Date().toISOString(),
    permissions: { status: 'unknown' },
    lists: {
      ensured: [],
      created: [],
      missing: [],
      fieldsCreated: {},
      errors: {},
      schemaMismatches: {},
    },
  };
  let resolvedTitle: string | null = null;

  const candidateKeys = getListCandidates(def);

  await clientDataService.withInstance(instance.slug, async () => {
    let digest: string;
    try {
      digest = await clientDataService.requestDigest();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      health.lists.errors.__digest = message;
      const err = new Error(`Digest Fehler: ${message}`);
      (err as Error & { details?: unknown }).details = {
        phase: 'digest',
        listKey: def.key,
        errors: { ...health.lists.errors },
        permissions: health.permissions,
      };
      throw err;
    }

    resolvedTitle = await ensureList(def, digest, health);
    if (resolvedTitle) {
      await validateListSchema(def, resolvedTitle, health);
    }
    if (!resolvedTitle) {
      const relevantErrors = Object.entries(health.lists.errors)
        .filter(([errorKey]) => candidateKeys.some((candidate) => errorKey.startsWith(candidate)))
        .map(([, errorMessage]) => errorMessage);
      if (health.lists.errors.__digest) {
        relevantErrors.push(`Digest: ${health.lists.errors.__digest}`);
      }
      const message =
        relevantErrors.length > 0
          ? relevantErrors.join('; ')
          : 'SharePoint Liste konnte nicht erstellt werden';
      const err = new Error(message);
      (err as Error & { details?: unknown }).details = {
        phase: 'fields',
        listKey: def.key,
        candidates: candidateKeys,
        messages: relevantErrors,
        errors: { ...health.lists.errors },
        permissions: health.permissions,
      };
      throw err;
    }
  });

  return {
    key: def.key,
    title: def.title,
    resolvedTitle: resolvedTitle ?? def.title,
    lists: health.lists,
  };
}

export async function ensureSharePointListForInstance(
  instance: RoadmapInstanceConfig,
  key: string
): Promise<SharePointListEnsureResult> {
  return withProvisioningLock(instance.slug, () =>
    ensureSharePointListForInstanceUnlocked(instance, key)
  );
}

async function deleteSharePointListForInstanceUnlocked(
  instance: RoadmapInstanceConfig,
  key: string
): Promise<SharePointListDeleteResult> {
  const def = SHAREPOINT_LIST_DEFINITIONS.find((candidate) => candidate.key === key);
  if (!def) {
    throw new Error(`Unbekannter Listen-Schlüssel "${key}"`);
  }

  const result: SharePointListDeleteResult = {
    key: def.key,
    title: def.title,
    status: 'missing',
  };
  const errors: string[] = [];

  await clientDataService.withInstance(instance.slug, async () => {
    let digest: string;
    try {
      digest = await clientDataService.requestDigest();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      errors.push(`Digest: ${message}`);
      throw new Error(`Digest Fehler: ${message}`);
    }

    const candidates = getListCandidates(def);
    let resolved: string | null = null;
    for (const candidate of candidates) {
      const check = await clientDataService.sharePointFetch(
        `/api/sharepoint/_api/web/lists/getByTitle('${encodeSharePointValue(candidate)}')?$select=Id`,
        { headers: jsonHeaders }
      );
      if (check.ok) {
        resolved = candidate;
        break;
      }
      if (check.status !== 404) {
        const message = await readError(check);
        errors.push(`${candidate}: ${message}`);
      }
    }

    if (!resolved && errors.length > 0) {
      throw new Error(errors.join('; '));
    }
    if (!resolved) {
      return;
    }

    try {
      await deleteListByTitle(resolved, digest);
      result.status = 'deleted';
      result.resolvedTitle = resolved;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
      errors.push(message);
      throw new Error(message);
    }
  });

  if (errors.length > 0) {
    result.errors = errors;
  }
  return result;
}

export async function deleteSharePointListForInstance(
  instance: RoadmapInstanceConfig,
  key: string
): Promise<SharePointListDeleteResult> {
  return withProvisioningLock(instance.slug, () =>
    deleteSharePointListForInstanceUnlocked(instance, key)
  );
}

async function provisionSharePointForInstanceUnlocked(
  instance: RoadmapInstanceConfig
): Promise<RoadmapInstanceHealth> {
  const health: RoadmapInstanceHealth = {
    checkedAt: new Date().toISOString(),
    compatibility: { status: 'unknown' },
    permissions: { status: 'unknown' },
    lists: {
      ensured: [],
      created: [],
      missing: [],
      fieldsCreated: {},
      errors: {},
      schemaMismatches: {},
    },
  };

  const siteUrl = resolveSharePointSiteUrl(instance);
  const strategy = normalizeSharePointStrategy(
    instance?.sharePoint?.strategy || process.env.SP_STRATEGY || 'kerberos'
  );

  await clientDataService.withInstance(instance.slug, async () => {
    try {
      let digest: string;
      try {
        digest = await clientDataService.requestDigest();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
        health.permissions = { status: 'error', message: `Digest Fehler: ${message}` };
        health.lists.errors.__digest = message;
        return;
      }

      await probeCompatibility(health);

      for (const def of SHAREPOINT_LIST_DEFINITIONS) {
        const resolved = await ensureList(def, digest, health);
        if (!resolved) {
          health.lists.missing.push(def.title);
          continue;
        }

        // Validate schema after ensuring fields so we can report remaining mismatches
        // (e.g., missing columns when the current user lacks permissions to create them).
        await validateListSchema(def, resolved, health);
      }

      const permissionResult = await probePermissions(digest);
      health.permissions = permissionResult;
    } catch (error) {
      if (error instanceof SharePointAuthError) {
        recordAuthFailure(health, error.status, error.message, {
          siteUrl,
          strategy,
          context: error.context,
        });
        return;
      }
      throw error;
    }
  });

  return health;
}

export async function provisionSharePointForInstance(
  instance: RoadmapInstanceConfig
): Promise<RoadmapInstanceHealth> {
  return withProvisioningLock(instance.slug, () =>
    provisionSharePointForInstanceUnlocked(instance)
  );
}
