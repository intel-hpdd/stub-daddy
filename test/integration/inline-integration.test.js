import stubDaddyModule from '../../server';
import reqModule from '@mfl/req';
import fixtures from '../fixtures/standard-fixtures';
import * as url from 'url';
import streamToPromise from '../../stream-to-promise.js';

import { describe, beforeEach, it, jasmine, expect } from '../jasmine.js';
const port = 8120;

describe('inline integration tests', () => {
  let service, makeRequest, webService, req;

  beforeEach(() => {
    const stubDaddy = stubDaddyModule({ port });
    service = stubDaddy.inlineService;
    webService = stubDaddy.webService;
    webService.startService();

    req = reqModule('https');

    const urlString = `${stubDaddy.config.get('requestProtocol')}://localhost:${port}`;
    makeRequest = makeRequestFactory(urlString, req);
  });

  afterEach(done => {
    service.flush();
    webService.stopService(done.fail, done);
  });

  describe('create mock', () => {
    let mock, result;
    [
      'request',
      'response',
      'expires',
      'dependencies'
    ].forEach(valueToRemove => {
      describe(`${valueToRemove} with required properties missing`, () => {
        it('should fail to create mock', () => {
          mock = omit(valueToRemove);
          expect(service.mock.bind(service, mock)).toThrow();
        });
      });
    });

    describe('with all required properties', () => {
      beforeEach(() => {
        mock = {
          ...fixtures.integration.registerSuccessfulMockRequest.json.json
        };
        result = service.mock(mock);
      });

      it('should register the mock successfully', () => {
        expect(result).toEqual({
          statusCode: 201,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      });

      describe('and verify mock', () => {
        it('should return matched response', async () => {
          const result = await streamToPromise(makeRequest(mock.request));
          expect(result).toEqual({
            statusCode: mock.response.statusCode,
            body: mock.response.data,
            headers: jasmine.any(Object)
          });
        });
      });
    });
  });

  describe('check mock state', () => {
    let mock;

    describe('with all registered requests called appropriately', () => {
      it('should be in good state', async () => {
        mock = {
          ...fixtures.integration.registerSuccessfulMockPOSTRequest.json.json
        };
        service.mock(mock);

        await streamToPromise(makeRequest(mock.request));
        expect(service.mockState()).toEqual({
          data: [],
          headers: {
            'Content-Type': 'application/json'
          },
          statusCode: 200
        });
      });
    });

    describe('with an invalid request made', () => {
      it('should indicate an error in the mock state', () => {
        expect(() => {
          service.makeRequest({
            method: 'POST',
            url: '/invalid/rest/call',
            data: {
              invalid: 'parameter'
            },
            headers: {}
          });
        }).toThrow(jasmine.any(Error));
      });
    });
  });

  describe('check mock list', () => {
    let mock, registeredMocks;

    beforeEach(() => {
      mock = {
        ...fixtures.integration.registerSuccessfulMockPOSTRequest.json.json,
        expires: 1
      };

      service.mock(mock);
      registeredMocks = service.registeredMocks();
    });

    it('should return all registered mocks', () => {
      expect({ ...registeredMocks }).toEqual({
        statusCode: 200,
        data: [
          {
            request: {
              method: 'POST',
              url: '/user/profile',
              data: {
                user: 'johndoe',
                key: 'abc123'
              },
              qs: {},
              headers: {
                authorization: 'BEARER token55'
              }
            },
            response: {
              statusCode: 200,
              data: {
                firstName: 'John',
                lastName: 'Doe',
                dob: '1981-09-07',
                city: 'Orlando',
                state: 'FL'
              },
              headers: {
                authorization: 'BEARER token55',
                'content-type': 'application/json'
              }
            },
            expires: 1,
            dependencies: [],
            remainingCalls: 1,
            calls: 0,
            timeout: 0
          }
        ],
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });

    describe('after a request to a registered call has been made', () => {
      it('should no longer list the mock after expiration', async () => {
        await streamToPromise(makeRequest(mock.request));
        expect(service.registeredMocks()).toEqual({
          statusCode: 200,
          data: [],
          headers: {
            'Content-Type': 'application/json'
          }
        });
      });
    });
  });
});

function omit(name) {
  const omitted = {
    ...fixtures.integration.registerSuccessfulMockRequest.json.json
  };
  delete omitted[name];
}

function makeRequestFactory(urlString, req) {
  const serverHttpUrl = url.parse(urlString);

  return options => {
    if (!options) throw new Error('Options is required to make a request.');

    options = {
      ...options,
      strictSSL: false,
      path: options.url,
      headers: { ...options.headers, Connection: 'close' },
      json: { ...options.data },
      localhost: serverHttpUrl.href,
      host: serverHttpUrl.host,
      hostname: serverHttpUrl.hostname,
      port: serverHttpUrl.port
    };

    return req.bufferJsonRequest(options);
  };
}
