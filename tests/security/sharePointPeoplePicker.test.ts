import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSharePointPeoplePickerRequest,
  parseSharePointPeoplePickerResponse,
  searchSharePointSiteUsers,
} from '../../utils/sharePointPeoplePicker';

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
      AllUrlZones: false,
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

test('SharePoint People Picker falls back to matching users known to the current site', () => {
  assert.deepEqual(
    searchSharePointSiteUsers(
      [
        {
          Id: 17,
          Title: 'Boni, Fabian',
          Email: 'fabian.boni@jsd.bs.ch',
          LoginName: 'i:0#.w|domain\\fabian.boni',
          PrincipalType: 1,
        },
        {
          Id: 23,
          Title: 'Roadmap Owners',
          LoginName: 'Roadmap Owners',
          PrincipalType: 8,
        },
      ],
      'fabian'
    ),
    [
      {
        id: '17',
        displayName: 'Fabian Boni',
        email: 'fabian.boni@jsd.bs.ch',
        loginName: 'i:0#.w|domain\\fabian.boni',
      },
    ]
  );
});

test('SharePoint site-user fallback matches email and rejects short queries', () => {
  const users = [
    {
      Id: 17,
      Title: 'Fabian Boni',
      Email: 'fabian.boni@jsd.bs.ch',
      LoginName: 'i:0#.w|domain\\fabian.boni',
    },
  ];
  assert.equal(searchSharePointSiteUsers(users, 'fa').length, 1);
  assert.equal(searchSharePointSiteUsers(users, 'jsd.bs.ch').length, 1);
  assert.deepEqual(searchSharePointSiteUsers(users, 'f'), []);
});
