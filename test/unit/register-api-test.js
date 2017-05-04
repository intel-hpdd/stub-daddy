const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
import querystring from 'querystring';

describe('register api module', function() {
  let registerResponse,
    registerAPI,
    entryRequest,
    entryResponse,
    body,
    entryDependencies,
    entry,
    entries;

  beforeEach(function() {
    require('../../config');

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

    entries = [];

    entry = {
      addEntry: jasmine.createSpy('addEntry'),
      parsedQueryData: jasmine
        .createSpy('parsedQueryData')
        .and.callFake(function(parsedUrl) {
          return querystring.parse(parsedUrl.query);
        })
    };

    const logger = jasmine.createSpyObj('logger', ['info', 'debug', 'trace']);
    registerAPI = proxyquire('../../lib/register-api', {
      '../logger': logger,
      './entries': entries,
      './entry': entry
    });
  });

  describe('successfully register a mock api with a body in the correct format', function() {
    it('should call entry.addEntry', function() {
      registerResponse = registerAPI(body);
      expect(entry.addEntry).toHaveBeenCalledOnceWith(
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

    it('should include dependency response if specified', function() {
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
      registerAPI(body);

      expect(entry.addEntry).toHaveBeenCalledWith(
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
        entries
      );
    });

    it('should have a status of 201', function() {
      registerResponse = registerAPI(body);
      expect(registerResponse.statusCode).toEqual(201);
    });
  });
});
