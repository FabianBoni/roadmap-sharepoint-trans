import assert from 'node:assert/strict';
import test from 'node:test';
import type { RoadmapInstanceConfig } from '../../types/roadmapInstance';
import { clientDataService } from '../../utils/clientDataService';
import {
  deleteSharePointListForInstance,
  ensureSharePointListForInstance,
  getSharePointListOverview,
} from '../../utils/sharePointProvisioning';
import { SHAREPOINT_LIST_DEFINITIONS } from '../../utils/sharePointLists';

const instance = {
  id: 1,
  slug: 'provisioning-test',
  displayName: 'Provisioning Test',
  hosts: [],
  sharePoint: {
    siteUrlDev: 'https://sharepoint.example/sites/test',
    siteUrlProd: 'https://sharepoint.example/sites/test',
    strategy: 'kerberos',
  },
} satisfies RoadmapInstanceConfig;

const mockService = async (
  overrides: Partial<Record<keyof typeof clientDataService, unknown>>,
  run: () => Promise<void>
) => {
  const service = clientDataService as unknown as Record<string, unknown>;
  const originals = new Map<string, unknown>();

  for (const [name, replacement] of Object.entries(overrides)) {
    originals.set(name, service[name]);
    service[name] = replacement;
  }

  try {
    await run();
  } finally {
    for (const [name, original] of originals) {
      service[name] = original;
    }
  }
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const headerValue = (headers: HeadersInit | undefined, name: string): string | null =>
  new Headers(headers).get(name);

test('list overview normalizes verbose and value OData envelopes', async () => {
  let successfulResponse = 0;

  await mockService(
    {
      withInstance: async (_slug: string, run: () => Promise<unknown>) => run(),
      sharePointFetch: async () => {
        successfulResponse += 1;
        if (successfulResponse === 1) {
          return jsonResponse({
            d: {
              Title: 'Roadmap Projects',
              ItemCount: 7,
              Created: '2026-01-02T03:04:05Z',
              LastItemModifiedDate: '2026-02-03T04:05:06Z',
              DefaultViewUrl: '/sites/test/Lists/RoadmapProjects/AllItems.aspx',
              RootFolder: { ServerRelativeUrl: '/sites/test/Lists/RoadmapProjects' },
            },
          });
        }
        if (successfulResponse === 2) {
          return jsonResponse({
            value: [
              {
                Title: 'Roadmap Documents',
                ItemCount: 3,
                RootFolder: { ServerRelativeUrl: '/sites/test/RoadmapDocuments' },
              },
            ],
          });
        }
        return jsonResponse({ error: { message: 'not found' } }, 404);
      },
    },
    async () => {
      const overview = await getSharePointListOverview(instance);

      assert.deepEqual(
        {
          title: overview[0].resolvedTitle,
          items: overview[0].itemCount,
          created: overview[0].created,
          modified: overview[0].modified,
          view: overview[0].defaultViewUrl,
          folder: overview[0].serverRelativeUrl,
        },
        {
          title: 'Roadmap Projects',
          items: 7,
          created: '2026-01-02T03:04:05Z',
          modified: '2026-02-03T04:05:06Z',
          view: '/sites/test/Lists/RoadmapProjects/AllItems.aspx',
          folder: '/sites/test/Lists/RoadmapProjects',
        }
      );
      assert.equal(overview[1].resolvedTitle, 'Roadmap Documents');
      assert.equal(overview[1].itemCount, 3);
      assert.equal(overview[1].serverRelativeUrl, '/sites/test/RoadmapDocuments');
    }
  );
});

test('delete propagates a non-successful SharePoint response', async () => {
  await mockService(
    {
      withInstance: async (_slug: string, run: () => Promise<unknown>) => run(),
      requestDigest: async () => 'digest',
      sharePointFetch: async (_url: string, init?: RequestInit) => {
        if (init?.method === 'POST') {
          return new Response('cannot delete list', { status: 500 });
        }
        return jsonResponse({ Id: 'list-id' });
      },
    },
    async () => {
      await assert.rejects(
        deleteSharePointListForInstance(instance, 'Roadmap Settings'),
        /cannot delete list|500/i
      );
    }
  );
});

test('existing field metadata mismatch triggers MERGE, verification and cache invalidation', async () => {
  const settingsDefinition = SHAREPOINT_LIST_DEFINITIONS.find(
    (definition) => definition.key === 'Roadmap Settings'
  );
  assert.ok(settingsDefinition);

  const expectedFields = new Set(settingsDefinition.fields.map((field) => field.name));
  const expectedTypes = Object.fromEntries(
    settingsDefinition.fields.map((field) => [field.name, 'Note'])
  );
  const requests: Array<{ url: string; init?: RequestInit }> = [];
  let valueReadCount = 0;
  let invalidatedList: string | undefined;

  const currentValueField = (correct: boolean) => ({
    InternalName: 'Value',
    Title: 'Value',
    TypeAsString: 'Note',
    Required: false,
    Hidden: false,
    ReadOnlyField: false,
    Indexed: false,
    EnforceUniqueValues: false,
    Description: '',
    DefaultValue: null,
    SchemaXml: correct
      ? '<Field DisplayName="Value" Name="Value" Type="Note" NumLines="12" RichText="FALSE" />'
      : '<Field DisplayName="Value" Name="Value" Type="Note" NumLines="4" RichText="TRUE" />',
  });
  const currentDescriptionField = {
    InternalName: 'Description',
    Title: 'Description',
    TypeAsString: 'Note',
    Required: false,
    Hidden: false,
    ReadOnlyField: false,
    Indexed: false,
    EnforceUniqueValues: false,
    Description: '',
    DefaultValue: null,
    SchemaXml:
      '<Field DisplayName="Description" Name="Description" Type="Note" NumLines="8" RichText="FALSE" />',
  };

  await mockService(
    {
      withInstance: async (_slug: string, run: () => Promise<unknown>) => run(),
      requestDigest: async () => 'digest',
      getListFieldNames: async () => new Set(expectedFields),
      getListFieldTypes: async () => ({ ...expectedTypes }),
      invalidateListSchemaCache: (listName?: string) => {
        invalidatedList = listName;
      },
      sharePointFetch: async (url: string, init?: RequestInit) => {
        requests.push({ url, init });
        if (url.endsWith('?$select=Id')) return jsonResponse({ Id: 'settings-list-id' });
        if (url.includes("getByInternalNameOrTitle('Value')")) {
          if (init?.method === 'POST') return jsonResponse({});
          valueReadCount += 1;
          return jsonResponse({ d: currentValueField(valueReadCount > 1) });
        }
        if (url.includes("getByInternalNameOrTitle('Description')")) {
          return jsonResponse({ value: [currentDescriptionField] });
        }
        throw new Error(`Unexpected SharePoint request: ${url}`);
      },
    },
    async () => {
      const result = await ensureSharePointListForInstance(instance, 'Roadmap Settings');

      const merge = requests.find(
        ({ url, init }) =>
          url.includes("getByInternalNameOrTitle('Value')") &&
          init?.method === 'POST' &&
          headerValue(init.headers, 'X-HTTP-Method') === 'MERGE'
      );
      assert.ok(merge, 'the existing mismatched field must be updated with MERGE');
      const mergeBody = JSON.parse(String(merge.init?.body || '{}')) as Record<string, unknown>;
      assert.deepEqual(mergeBody.__metadata, { type: 'SP.FieldMultiLineText' });
      assert.equal(mergeBody.NumberOfLines, 12);
      assert.equal(mergeBody.RichText, false);
      assert.equal(valueReadCount, 2, 'the updated field must be fetched again for verification');
      assert.equal(invalidatedList, 'Roadmap Settings');
      assert.deepEqual(result.lists.fieldsUpdated?.['Roadmap Settings'], ['Value']);
      assert.equal(result.lists.errors['Roadmap Settings.Value'], undefined);
    }
  );
});

test('existing text field MaxLength is reconciled and verified', async () => {
  let roleReads = 0;
  let mergeBody: Record<string, unknown> | null = null;
  const textField = (name: string, maxLength: number) => ({
    InternalName: name,
    Title: name,
    TypeAsString: 'Text',
    Required: false,
    Hidden: false,
    ReadOnlyField: false,
    Indexed: false,
    EnforceUniqueValues: false,
    SchemaXml: `<Field DisplayName="${name}" Name="${name}" Type="Text" MaxLength="${maxLength}" />`,
  });

  await mockService(
    {
      withInstance: async (_slug: string, run: () => Promise<unknown>) => run(),
      requestDigest: async () => 'digest',
      getListFieldNames: async () => new Set(['Role', 'ProjectId']),
      getListFieldTypes: async () => ({ Role: 'Text', ProjectId: 'Text' }),
      invalidateListSchemaCache: () => undefined,
      sharePointFetch: async (url: string, init?: RequestInit) => {
        if (url.endsWith('?$select=Id')) return jsonResponse({ Id: 'team-list-id' });
        if (url.includes("getByInternalNameOrTitle('Role')")) {
          if (init?.method === 'POST') {
            mergeBody = JSON.parse(String(init.body || '{}')) as Record<string, unknown>;
            return jsonResponse({});
          }
          roleReads += 1;
          return jsonResponse(textField('Role', roleReads > 1 ? 100 : 20));
        }
        if (url.includes("getByInternalNameOrTitle('ProjectId')")) {
          return jsonResponse(textField('ProjectId', 120));
        }
        throw new Error(`Unexpected SharePoint request: ${url}`);
      },
    },
    async () => {
      const result = await ensureSharePointListForInstance(instance, 'Roadmap Team Members');
      assert.equal(mergeBody?.MaxLength, 100);
      assert.deepEqual(mergeBody?.__metadata, { type: 'SP.FieldText' });
      assert.equal(roleReads, 2);
      assert.deepEqual(result.lists.fieldsUpdated?.['Roadmap Team Members'], ['Role']);
    }
  );
});

test('incompatible existing field type is reported without destructive replacement', async () => {
  let fieldMutationAttempted = false;
  let destructiveMutationAttempted = false;

  await mockService(
    {
      withInstance: async (_slug: string, run: () => Promise<unknown>) => run(),
      requestDigest: async () => 'digest',
      getListFieldNames: async () => new Set(['Value', 'Description']),
      getListFieldTypes: async () => ({ Value: 'Text', Description: 'Note' }),
      invalidateListSchemaCache: () => undefined,
      sharePointFetch: async (url: string, init?: RequestInit) => {
        if (
          init?.method === 'POST' &&
          (url.includes('/fields/CreateFieldAsXml') ||
            headerValue(init.headers, 'X-HTTP-Method') === 'DELETE')
        ) {
          destructiveMutationAttempted = true;
        }
        if (url.endsWith('?$select=Id')) return jsonResponse({ Id: 'settings-list-id' });
        if (url.includes("getByInternalNameOrTitle('Value')")) {
          if (init?.method === 'POST') fieldMutationAttempted = true;
          return jsonResponse({
            InternalName: 'Value',
            Title: 'Value',
            TypeAsString: 'Text',
            Required: false,
            Hidden: false,
            ReadOnlyField: false,
            Indexed: false,
            EnforceUniqueValues: false,
            SchemaXml: '<Field DisplayName="Value" Name="Value" Type="Text" MaxLength="255" />',
          });
        }
        if (url.includes("getByInternalNameOrTitle('Description')")) {
          return jsonResponse({
            InternalName: 'Description',
            Title: 'Description',
            TypeAsString: 'Note',
            Required: false,
            Hidden: false,
            ReadOnlyField: false,
            Indexed: false,
            EnforceUniqueValues: false,
            SchemaXml:
              '<Field DisplayName="Description" Name="Description" Type="Note" NumLines="8" RichText="FALSE" />',
          });
        }
        throw new Error(`Unexpected SharePoint request: ${url}`);
      },
    },
    async () => {
      const result = await ensureSharePointListForInstance(instance, 'Roadmap Settings');

      assert.equal(fieldMutationAttempted, false);
      assert.equal(destructiveMutationAttempted, false);
      assert.match(result.lists.errors['Roadmap Settings.Value'], /Inkompatibler Spaltentyp/i);
      assert.deepEqual(result.lists.overwriteRequired?.['Roadmap Settings'], [
        { field: 'Value', expected: 'Note', actual: 'Text' },
      ]);
      assert.deepEqual(result.lists.schemaMismatches?.['Roadmap Settings']?.typeMismatches, [
        { field: 'Value', expected: 'Note', actual: 'Text' },
      ]);
    }
  );
});

test('schema cache invalidation clears names, types and in-flight schema for one list', async () => {
  const service = clientDataService as unknown as {
    getInstanceCacheKey(suffix?: string): string;
    listFieldsCache: Record<string, Set<string> | undefined>;
    listFieldTypeCache: Record<string, Record<string, string> | undefined>;
    listFieldSchemaInFlight: Record<string, Promise<void> | undefined>;
  };

  await clientDataService.withInstance(instance.slug, async () => {
    const settingsKey = service.getInstanceCacheKey('Roadmap Settings');
    const projectsKey = service.getInstanceCacheKey('Roadmap Projects');
    const pending = Promise.resolve();

    service.listFieldsCache[settingsKey] = new Set(['stale']);
    service.listFieldTypeCache[settingsKey] = { stale: 'Text' };
    service.listFieldSchemaInFlight[settingsKey] = pending;
    service.listFieldsCache[projectsKey] = new Set(['keep']);
    service.listFieldTypeCache[projectsKey] = { keep: 'Text' };

    clientDataService.invalidateListSchemaCache('Roadmap Settings');

    assert.equal(service.listFieldsCache[settingsKey], undefined);
    assert.equal(service.listFieldTypeCache[settingsKey], undefined);
    assert.equal(service.listFieldSchemaInFlight[settingsKey], undefined);
    assert.deepEqual(Array.from(service.listFieldsCache[projectsKey]), ['keep']);
    assert.deepEqual(service.listFieldTypeCache[projectsKey], { keep: 'Text' });

    delete service.listFieldsCache[projectsKey];
    delete service.listFieldTypeCache[projectsKey];
  });
});

test('list creation recovers when a concurrent provisioner wins the create race', async () => {
  let listChecks = 0;

  await mockService(
    {
      withInstance: async (_slug: string, run: () => Promise<unknown>) => run(),
      requestDigest: async () => 'digest',
      getListFieldNames: async () => new Set(['Value', 'Description']),
      getListFieldTypes: async () => ({ Value: 'Note', Description: 'Note' }),
      invalidateListSchemaCache: () => undefined,
      sharePointFetch: async (url: string, init?: RequestInit) => {
        if (url.endsWith('?$select=Id')) {
          listChecks += 1;
          return listChecks === 1
            ? jsonResponse({ error: { message: 'not found' } }, 404)
            : jsonResponse({ Id: 'created-by-other-request' });
        }
        if (url.endsWith('/_api/web/lists') && init?.method === 'POST') {
          return new Response('A list with this title already exists', { status: 409 });
        }
        if (url.includes("getByInternalNameOrTitle('Value')")) {
          return jsonResponse({
            InternalName: 'Value',
            Title: 'Value',
            TypeAsString: 'Note',
            Required: false,
            Hidden: false,
            ReadOnlyField: false,
            Indexed: false,
            EnforceUniqueValues: false,
            SchemaXml:
              '<Field DisplayName="Value" Name="Value" Type="Note" NumLines="12" RichText="FALSE" />',
          });
        }
        if (url.includes("getByInternalNameOrTitle('Description')")) {
          return jsonResponse({
            InternalName: 'Description',
            Title: 'Description',
            TypeAsString: 'Note',
            Required: false,
            Hidden: false,
            ReadOnlyField: false,
            Indexed: false,
            EnforceUniqueValues: false,
            SchemaXml:
              '<Field DisplayName="Description" Name="Description" Type="Note" NumLines="8" RichText="FALSE" />',
          });
        }
        throw new Error(`Unexpected SharePoint request: ${url}`);
      },
    },
    async () => {
      const result = await ensureSharePointListForInstance(instance, 'Roadmap Settings');

      assert.equal(result.resolvedTitle, 'Roadmap Settings');
      assert.equal(listChecks, 2, 'the list must be checked again after a create conflict');
      assert.equal(result.lists.errors['Roadmap Settings'], undefined);
    }
  );
});

test('built-in SharePoint fields are not reported as unexpected application schema', async () => {
  const builtInFields = ['ID', 'Title', 'Created', 'Modified', 'Author', 'Editor', 'Attachments'];

  await mockService(
    {
      withInstance: async (_slug: string, run: () => Promise<unknown>) => run(),
      requestDigest: async () => 'digest',
      getListFieldNames: async () => new Set(['Value', 'Description', ...builtInFields]),
      getListFieldTypes: async () => ({
        Value: 'Note',
        Description: 'Note',
        ID: 'Counter',
        Title: 'Text',
        Created: 'DateTime',
        Modified: 'DateTime',
        Author: 'User',
        Editor: 'User',
        Attachments: 'Attachments',
      }),
      invalidateListSchemaCache: () => undefined,
      sharePointFetch: async (url: string) => {
        if (url.endsWith('?$select=Id')) return jsonResponse({ Id: 'settings-list-id' });
        if (url.includes("getByInternalNameOrTitle('Value')")) {
          return jsonResponse({
            InternalName: 'Value',
            Title: 'Value',
            TypeAsString: 'Note',
            Required: false,
            Hidden: false,
            ReadOnlyField: false,
            Indexed: false,
            EnforceUniqueValues: false,
            SchemaXml:
              '<Field DisplayName="Value" Name="Value" Type="Note" NumLines="12" RichText="FALSE" />',
          });
        }
        if (url.includes("getByInternalNameOrTitle('Description')")) {
          return jsonResponse({
            InternalName: 'Description',
            Title: 'Description',
            TypeAsString: 'Note',
            Required: false,
            Hidden: false,
            ReadOnlyField: false,
            Indexed: false,
            EnforceUniqueValues: false,
            SchemaXml:
              '<Field DisplayName="Description" Name="Description" Type="Note" NumLines="8" RichText="FALSE" />',
          });
        }
        throw new Error(`Unexpected SharePoint request: ${url}`);
      },
    },
    async () => {
      const result = await ensureSharePointListForInstance(instance, 'Roadmap Settings');
      const mismatch = result.lists.schemaMismatches?.['Roadmap Settings'];

      assert.deepEqual(mismatch?.unexpected ?? [], []);
    }
  );
});
