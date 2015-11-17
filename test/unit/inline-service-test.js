'use strict';

var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var fixtures = require('../fixtures/standard-fixtures');
var fp = require('intel-fp/dist/fp');
var obj = require('intel-obj');

describe('inline-service', function () {
  var service, registerApiValidator, logger, requestValidator, entry, mockStatus,
    spy, dispatch, mockState, parseUrl;
  beforeEach(function () {
    spy = jasmine.createSpy('spy');
    registerApiValidator = jasmine.createSpy('registerApiValidator');
    logger = {
      info: jasmine.createSpy('logger.info'),
      debug: jasmine.createSpy('logger.debug'),
      trace: jasmine.createSpy('logger.trace')
    };
    requestValidator = jasmine.createSpy('requestValidator');
    entry = {
      flushEntries: jasmine.createSpy('entry.flushEntries')
    };
    mockStatus = {
      flushRequests: jasmine.createSpy('mockStatus.flushRequests')
    };
    mockState = [
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

    dispatch = jasmine.createSpy('dispatch');

    parseUrl = {
      parse: jasmine.createSpy('parseUrl')
    };

    service = proxyquire('../../inline-service', {
      './validators/register-api-validator': registerApiValidator,
      './logger': logger,
      './validators/request-validator': requestValidator,
      './lib/entry': entry,
      './lib/mock-status': mockStatus,
      './lib/dispatch': dispatch,
      'url': parseUrl
    });
  });

  describe('mock', function () {
    var mock;

    describe('mocking', function () {
      var result;
      beforeEach(function () {
        mock = {
          request: {},
          response: {},
          expires: 1
        };

        registerApiValidator.and.returnValue({errors: []});
      });

      it('should call dispatch', function () {
        parseUrl.parse.and.returnValue({path: '/api/mock'});
        result = service.mock(mock);
        expect(dispatch).toHaveBeenCalledOnceWith('/api/mock',
          'POST',
          {
            data: mock,
            parsedUrl: {path: '/api/mock'}
          }, {});
      });

      it('should return the data, headers and status', function () {
        dispatch.and.callFake(function dispatch (url, verb, request, response) {
          return {
            statusCode: 201,
            headers: {},
            data: {}
          };
        });

        result = service.mock(mock);
        expect(result).toEqual({
          data: {},
          statusCode: 201,
          headers: {}
        });
      });
    });

    describe('requesting the registered mock list', function () {
      var result;
      beforeEach(function () {
        requestValidator.and.returnValue({errors: []});
      });

      it('should call dispatch', function () {
        parseUrl.parse.and.returnValue({path: '/api/mocklist'});
        result = service.registeredMocks();
        expect(dispatch).toHaveBeenCalledOnceWith('/api/mocklist', 'GET', {
          parsedUrl: {path: '/api/mocklist'}
        }, {});
      });

      it('should return the data, headers and status', function () {
        dispatch.and.callFake(function dispatch() {
          return {
            statusCode: 201,
            headers: {},
            data: [fixtures.integration.registerSuccessfulMockRequest.json.json]
          };
        });

        result = service.registeredMocks();
        expect(result).toEqual({
          statusCode: 201,
          headers: {},
          data: [fixtures.integration.registerSuccessfulMockRequest.json.json]
        });
      });
    });

    describe('requesting the mock state', function () {
      var result;
      beforeEach(function () {
        requestValidator.and.returnValue({errors: []});
      });

      it('should call dispatch', function () {
        parseUrl.parse.and.returnValue({path: '/api/mockstate'});
        result = service.mockState();
        expect(dispatch).toHaveBeenCalledOnceWith('/api/mockstate', 'GET', {
          parsedUrl: {path: '/api/mockstate'}
        }, {});
      });

      it('should return the data, headers and status', function () {
        dispatch.and.callFake(function dispatch () {
          return {
            statusCode: 200,
            headers: {},
            data: mockState
          };
        });
        result = service.mockState();

        expect(result).toEqual({
          statusCode: 200,
          headers: {},
          data: mockState
        });
      });
    });

    describe('flushing the system', function () {
      var result;
      beforeEach(function () {
        result = service.flush();
      });

      it('should call entry.flushEntries', function () {
        expect(entry.flushEntries).toHaveBeenCalledOnce();
      });

      it('should call mockStatus.flushRequests', function () {
        expect(mockStatus.flushRequests).toHaveBeenCalledOnce();
      });
    });

    describe('making a dynamic request', function () {
      var s;
      beforeEach(function () {
        requestValidator.and.returnValue({errors: []});
        parseUrl.parse.and.returnValue({path: '/api/magic'});
        s = service.makeRequest({
          url: '/api/magic',
          method: 'GET',
          headers: {}
        });
      });

      it('should call dispatch', function () {
        expect(dispatch).toHaveBeenCalledOnceWith('/api/magic', 'GET', {
          url: '/api/magic',
          parsedUrl: {path: '/api/magic'},
          method: 'GET',
          headers: {}
        }, {});
      });
    });
  });
});
