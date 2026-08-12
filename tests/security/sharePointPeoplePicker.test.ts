import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSharePointPeoplePickerRequest,
  parseSharePointPeoplePickerResponse,
} from '../../utils/sharePointPeoplePicker';
import {
  buildGlobalSharePointPeoplePickerProxyUrl,
  buildGlobalSharePointPeoplePickerInstance,
  isSharePointPeoplePickerPath,
} from '../../utils/sharePointPeoplePickerSource';
import type { RoadmapInstanceConfig } from '../../types/roadmapInstance';

const entity = {
  Key: 'i:0#.w|domain\\fabian.boni',
  DisplayText: 'Boni, Fabian',
  EntityData: { Email: 'fabian.boni@jsd.bs.ch' },
};
const encodedEntities = JSON.stringify([entity]);

test('SharePoint People Picker request omits nullable optional CSOM fields', () => {
  assert.deepEqual(buildSharePointPeoplePickerRequest('fabian'), {
    queryParams: {
      AllowEmailAddresses: true,
      AllowMultipleEntities: false,
      AllUrlZones: true,
      MaximumEntitySuggestions: 20,
      PrincipalSource: 15,
      PrincipalType: 1,
      QueryString: 'fabian',
    },
  });
});

test('SharePoint People Picker accepts verbose and no-metadata response envelopes', () => {
  assert.deepEqual(
    parseSharePointPeoplePickerResponse({
      d: { ClientPeoplePickerSearchUser: encodedEntities },
    }),
    [entity]
  );
  assert.deepEqual(
    parseSharePointPeoplePickerResponse({
      ClientPeoplePickerSearchUser: encodedEntities,
    }),
    [entity]
  );
  assert.deepEqual(parseSharePointPeoplePickerResponse({ value: encodedEntities }), [entity]);
});

test('SharePoint People Picker accepts direct and nested encoded responses', () => {
  assert.deepEqual(parseSharePointPeoplePickerResponse(encodedEntities), [entity]);
  assert.deepEqual(
    parseSharePointPeoplePickerResponse(JSON.stringify({ value: encodedEntities })),
    [entity]
  );
});

test('SharePoint People Picker treats an empty successful response as no matches', () => {
  assert.deepEqual(parseSharePointPeoplePickerResponse(''), []);
  assert.deepEqual(parseSharePointPeoplePickerResponse({ value: '[]' }), []);
  assert.equal(parseSharePointPeoplePickerResponse({}), null);
});

test('SharePoint People Picker uses a global connection independent from the roadmap instance', () => {
  const sanitaet = {
    id: 17,
    slug: 'sanitaet',
    displayName: 'Sanitaet',
    deploymentEnv: 'production',
    hosts: ['sanitaet.example'],
    sharePoint: {
      siteUrlDev: 'https://wrong.example/sites/sanitaet-dev',
      siteUrlProd: 'https://wrong.example/sites/sanitaet',
      strategy: 'delegated',
      allowSelfSigned: true,
      trustedCaPath: '/wrong/ca.pem',
    },
  } satisfies RoadmapInstanceConfig;
  const source = buildGlobalSharePointPeoplePickerInstance(sanitaet, {
    NODE_ENV: 'production',
    SP_PEOPLE_PICKER_SITE_URL: 'https://sharepoint.example/sites/directory/',
    SP_PEOPLE_PICKER_STRATEGY: 'kerberos',
    SP_PEOPLE_PICKER_TRUSTED_CA_PATH: '/trusted/global-ca.pem',
  });

  assert.equal(source.slug, '__sharepoint-people-picker__');
  assert.equal(source.sharePoint.siteUrlProd, 'https://sharepoint.example/sites/directory');
  assert.equal(source.sharePoint.strategy, 'kerberos');
  assert.equal(source.sharePoint.allowSelfSigned, false);
  assert.equal(source.sharePoint.trustedCaPath, '/trusted/global-ca.pem');
  assert.equal(source.hosts.length, 0);
});

test('SharePoint People Picker uses the active instance site as directory entry point', () => {
  const instance = {
    id: 1,
    slug: 'sanitaet',
    displayName: 'Sanitaet',
    hosts: [],
    sharePoint: {
      siteUrlDev: 'https://sharepoint.example/sites/sanitaet-dev',
      siteUrlProd: 'https://sharepoint.example/sites/sanitaet',
      strategy: 'delegated',
      allowSelfSigned: true,
      trustedCaPath: '/instance/ca.pem',
    },
  } satisfies RoadmapInstanceConfig;

  const source = buildGlobalSharePointPeoplePickerInstance(instance, {
    NODE_ENV: 'production',
  });

  assert.equal(source.sharePoint.siteUrlProd, 'https://sharepoint.example/sites/sanitaet');
  assert.equal(source.sharePoint.strategy, 'delegated');
  assert.equal(source.sharePoint.allowSelfSigned, true);
  assert.equal(source.sharePoint.trustedCaPath, '/instance/ca.pem');
  assert.equal(
    isSharePointPeoplePickerPath(
      '/_api/SP.UI.ApplicationPages.ClientPeoplePickerWebServiceInterface.clientPeoplePickerSearchUser'
    ),
    true
  );
  const proxyUrl = new URL(
    buildGlobalSharePointPeoplePickerProxyUrl('http://127.0.0.1:3000/api/sharepoint/')
  );
  assert.equal(
    proxyUrl.pathname,
    '/api/sharepoint/_api/SP.UI.ApplicationPages.ClientPeoplePickerWebServiceInterface.clientPeoplePickerSearchUser'
  );
  assert.equal(proxyUrl.searchParams.get('sharePointDirectory'), 'global');
});

test('SharePoint People Picker fails closed when neither global nor instance URL exists', () => {
  const instance = {
    id: 1,
    slug: 'empty',
    displayName: 'Empty',
    hosts: [],
    sharePoint: {
      siteUrlDev: '',
      siteUrlProd: '',
      strategy: 'kerberos',
    },
  } satisfies RoadmapInstanceConfig;

  assert.throws(
    () => buildGlobalSharePointPeoplePickerInstance(instance, {}),
    /SharePoint People Picker URL is missing/
  );
});
