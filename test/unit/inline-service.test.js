import fixtures from '../fixtures/standard-fixtures';

import { describe, beforeEach, it, jasmine, expect, jest } from '../jasmine.js';

describe('inline-service', () => {
  let service,
    config,
    router,
    dispatcher,
    entries,
    status,
    mockEntry,
    mockDispatch,
    mockStateData,
    mockParseUrl;
  beforeEach(() => {
    entries = [];
    mockEntry = {
      flushEntries: jasmine.createSpy('entry.flushEntries')
    };
    status = {
      flushRequests: jasmine.createSpy('status.flushRequests')
    };
    mockStateData = [
      {
        state: 'ERROR',
        message: 'Call to expected mock not satisfied.',
        data: {
          request: {
            method: 'POST',
            url: '/user/profile',
            data: {
              user: 'janedoe',
              key: 'abc123'
            },
            headers: {
              authorization: 'BEARER token55'
            }
          },
          response: {
            statusCode: 200,
            data: {
              firstName: 'Jane',
              lastName: 'Doe',
              dob: '1981-09-13',
              city: 'Orlando',
              state: 'FL'
            },
            headers: {
              authorization: 'BEARER token55',
              'content-type': 'application/json'
            }
          },
          expires: 0,
          dependencies: [],
          remainingCalls: 1,
          calls: 0
        }
      }
    ];

    dispatcher = jasmine.createSpy('dispatcher');
    mockDispatch = jasmine.createSpy('dispatch').and.returnValue(dispatcher);

    mockParseUrl = {
      parse: jasmine.createSpy('parseUrl')
    };

    config = {
      get: jasmine.createSpy('get').and.returnValue({
        MOCK_REQUEST: '/api/mock',
        MOCK_STATE: '/api/mockstate',
        MOCK_LIST: '/api/mocklist'
      })
    };

    router = jest.fn('router');

    jest.mock('../lib/entry.js', () => mockEntry);
    jest.mock('../lib/dispatch.js', () => mockDispatch);
    jest.mock('url', () => mockParseUrl);

    service = require('../../inline-service').default(
      config,
      router,
      entries,
      status
    );
  });

  it('should pass the router to dispatch', () => {
    expect(mockDispatch).toHaveBeenCalledOnceWith(router);
  });

  describe('mock', () => {
    let mock;

    describe('mocking', () => {
      let result;
      beforeEach(() => {
        mock = {
          request: {},
          response: {},
          expires: 1
        };
      });

      it('should call dispatch', () => {
        mockParseUrl.parse.and.returnValue({ path: '/api/mock' });
        result = service.mock(mock);
        expect(dispatcher).toHaveBeenCalledOnceWith(
          '/api/mock',
          'POST',
          {
            data: mock,
            parsedUrl: { path: '/api/mock' }
          },
          {}
        );
      });

      it('should return the data, headers and status', () => {
        dispatcher.and.callFake(() => ({
          statusCode: 201,
          headers: {},
          data: {}
        }));

        result = service.mock(mock);
        expect(result).toEqual({
          data: {},
          statusCode: 201,
          headers: {}
        });
      });
    });

    describe('requesting the registered mock list', () => {
      let result;

      it('should call dispatch', () => {
        mockParseUrl.parse.and.returnValue({ path: '/api/mocklist' });
        result = service.registeredMocks();
        expect(dispatcher).toHaveBeenCalledOnceWith(
          '/api/mocklist',
          'GET',
          {
            parsedUrl: { path: '/api/mocklist' }
          },
          {}
        );
      });

      it('should return the data, headers and status', () => {
        dispatcher.and.callFake(() => ({
          statusCode: 201,
          headers: {},
          data: [fixtures.integration.registerSuccessfulMockRequest.json.json]
        }));

        result = service.registeredMocks();
        expect(result).toEqual({
          statusCode: 201,
          headers: {},
          data: [fixtures.integration.registerSuccessfulMockRequest.json.json]
        });
      });
    });

    describe('requesting the mock state', () => {
      let result;

      it('should call dispatch', () => {
        mockParseUrl.parse.and.returnValue({ path: '/api/mockstate' });
        result = service.mockState();
        expect(dispatcher).toHaveBeenCalledOnceWith(
          '/api/mockstate',
          'GET',
          {
            parsedUrl: { path: '/api/mockstate' }
          },
          {}
        );
      });

      it('should return the data, headers and status', () => {
        dispatcher.and.callFake(() => ({
          statusCode: 200,
          headers: {},
          data: mockStateData
        }));
        result = service.mockState();

        expect(result).toEqual({
          statusCode: 200,
          headers: {},
          data: mockStateData
        });
      });
    });

    describe('flushing the system', () => {
      beforeEach(() => {
        service.flush();
      });

      it('should call entry.flushEntries', () => {
        expect(mockEntry.flushEntries).toHaveBeenCalledOnceWith(entries);
      });

      it('should call status.flushRequests', () => {
        expect(status.flushRequests).toHaveBeenCalledOnce();
      });
    });

    describe('making a dynamic request', () => {
      beforeEach(() => {
        mockParseUrl.parse.and.returnValue({ path: '/api/magic' });
        service.makeRequest({
          url: '/api/magic',
          method: 'GET',
          headers: {}
        });
      });

      it('should call dispatch', () => {
        expect(dispatcher).toHaveBeenCalledOnceWith(
          '/api/magic',
          'GET',
          {
            url: '/api/magic',
            parsedUrl: { path: '/api/magic' },
            method: 'GET',
            headers: {}
          },
          {}
        );
      });
    });
  });
});
