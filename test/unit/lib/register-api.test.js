import querystring from 'querystring';

import {
  describe,
  beforeEach,
  it,
  jasmine,
  expect,
  jest
} from '../../jasmine.js';

describe('register api module', () => {
  let registerResponse,
    registerAPI,
    entryRequest,
    entryResponse,
    body,
    entryDependencies,
    mockEntry,
    mockEntries;

  beforeEach(() => {
    body = {
      request: {
        method: 'GET',
        url: '/some/path',
        data: {},
        headers: { headerKey: 'header value' }
      },
      response: {
        statusCode: '200',
        data: { dataKey: 'data value' },
        headers: { headerKey: 'header value' }
      },
      dependencies: [
        {
          method: 'PUT',
          url: '/put/path/',
          data: { key: 'value' },
          qs: {},
          headers: { headerKey: 'header value' }
        }
      ],
      expires: 0
    };

    entryRequest = {
      method: body.request.method,
      url: body.request.url,
      data: body.request.data,
      qs: {},
      headers: body.request.headers
    };

    entryResponse = {
      statusCode: body.response.statusCode,
      headers: body.response.headers,
      data: body.response.data
    };

    entryDependencies = [
      {
        method: body.dependencies[0].method,
        url: '/put/path',
        data: body.dependencies[0].data,
        qs: body.dependencies[0].qs,
        headers: body.dependencies[0].headers
      }
    ];

    mockEntries = [];

    mockEntry = {
      addEntry: jasmine.createSpy('addEntry'),
      parsedQueryData: jasmine
        .createSpy('parsedQueryData')
        .and.callFake(parsedUrl => querystring.parse(parsedUrl.query))
    };

    const mockLogger = jasmine.createSpyObj('logger', [
      'info',
      'debug',
      'trace'
    ]);

    jest.mock('../logger.js', () => mockLogger);
    jest.mock('../lib/entry.js', () => mockEntry);

    registerAPI = require('../../../lib/register-api').default;
  });

  describe('successfully register a mock api with a body in the correct format', () => {
    it('should call entry.addEntry', () => {
      registerResponse = registerAPI(body, mockEntries);
      expect(mockEntry.addEntry).toHaveBeenCalledOnceWith(
        entryRequest,
        entryResponse,
        body.expires,
        [
          {
            request: entryDependencies[0],
            response: undefined
          }
        ],
        undefined,
        []
      );
    });

    it('should include dependency response if specified', () => {
      body.dependencies[0] = {
        request: {
          method: 'PUT',
          url: '/put/path',
          data: { key: 'value' },
          qs: {},
          headers: { headerKey: 'header value' }
        },
        response: {
          statusCode: 200,
          headers: {},
          data: { key: 'value' }
        }
      };
      registerAPI(body, mockEntries);

      expect(mockEntry.addEntry).toHaveBeenCalledWith(
        entryRequest,
        entryResponse,
        body.expires,
        [
          {
            request: entryDependencies[0],
            response: {
              statusCode: body.dependencies[0].response.statusCode,
              headers: body.dependencies[0].response.headers,
              data: body.dependencies[0].response.data
            }
          }
        ],
        undefined,
        mockEntries
      );
    });

    it('should have a status of 201', () => {
      registerResponse = registerAPI(body, mockEntries);
      expect(registerResponse.statusCode).toEqual(201);
    });
  });
});
