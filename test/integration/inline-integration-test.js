'use strict';

var stubDaddyModule = require('../../server');
var reqModule = require('intel-req');
var fixtures = require('../fixtures/standard-fixtures');
var format = require('util').format;
var url = require('url');
var obj = require('intel-obj');
var fp = require('intel-fp/dist/fp');
var req = require('intel-req');
var config = require('../../config');

describe('inline integration tests', function () {

  var service, makeRequest, webService, req;

  beforeEach(function () {
    var stubDaddy = stubDaddyModule();
    service = stubDaddy.inlineService;
    webService = stubDaddy.webService;

    req = reqModule();

    var urlString = format('%s://localhost:%s', config.get('requestProtocol'), config.get('port'));
    makeRequest = makeRequestFactory(urlString, req);

    webService.startService();
  });

  afterEach(function (done) {
    service.flush();

    webService.stopService(done.fail, done);
  });

  describe('create mock', function () {
    var mock, result, spy;

    ['request', 'response', 'expires', 'dependencies'].forEach(function (valueToRemove) {
      describe(format('%s with required properties missing', valueToRemove), function () {
        beforeEach(function () {
          mock = omit(valueToRemove);
        });

        it('should fail to create mock', function () {
          expect(service.mock.bind(service, mock)).toThrow();
        });
      });
    });

    describe('with all required properties', function () {
      beforeEach(function () {
        spy = jasmine.createSpy('spy');
        mock = obj.clone(fixtures.integration.registerSuccessfulMockRequest.json.json);
        result = service.mock(mock);
      });

      it('should register the mock successfully', function () {
        expect(result).toEqual({
          statusCode: 201,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      });

      describe('and verify mock', function () {
        it('should return matched response', function (done) {
          makeRequest(mock.request)
            .each(spy).done(function () {
              expect(spy).toHaveBeenCalledOnceWith({
                statusCode: mock.response.statusCode,
                body: mock.response.data,
                headers: jasmine.any(Object)
              });
              done();
            });
        });
      });
    });
  });

  describe('check mock state', function () {
    var mock, state, spy, s;

    describe('with all registered requests called appropriately', function () {
      it('should be in good state', function (done) {
        spy = jasmine.createSpy('spy');
        mock = obj.clone(fixtures.integration.registerSuccessfulMockPOSTRequest.json.json);
        service.mock(mock);

        s = makeRequest(mock.request)
          .each(function () {
            expect(service.mockState()).toEqual({
              data: [],
              headers: {
                'Content-Type': 'application/json'
              },
              statusCode: 200
            });
            done();
          });
      });
    });

    describe('with an invalid request made', function () {
      it('should indicate an error in the mock state', function () {
        expect(function () {
          s = service.makeRequest({
            method: 'POST',
            url: '/invalid/rest/call',
            data: {
              invalid: 'parameter'
            },
            headers: {}
          })
            .done(fp.noop);
        }).toThrow(jasmine.any(Error));
      });
    });
  });

  describe('check mock list', function () {
    var mock, registeredMocks;

    beforeEach(function () {
      mock = fp.flow(obj.clone, fp.curry(2, obj.merge)(fp.__, {expires: 1}))
      (fixtures.integration.registerSuccessfulMockPOSTRequest.json.json);

      service.mock(mock);
      registeredMocks = service.registeredMocks();
    });

    it('should return all registered mocks', function () {
      expect(obj.clone(registeredMocks)).toEqual({
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

    describe('after a request to a registered call has been made', function () {
      var s;
      beforeEach(function () {
        s = makeRequest(mock.request);
      });

      it('should no longer list the mock after expiration', function (done) {
        s.done(function () {
          expect(service.registeredMocks()).toEqual({
            statusCode: 200,
            data: [],
            headers: {
              'Content-Type': 'application/json'
            }
          });
          done();
        });
      });
    });
  });
});

function omit(name) {
  var picker = fp.flow(fp.eq(name), fp.not);
  return obj.pickBy(fp.flip(2, picker),
    fixtures.integration.registerSuccessfulMockRequest.json.json);
}

function makeRequestFactory(urlString, req) {
  var serverHttpUrl = url.parse(urlString);

  return function makeRequest(options) {
    if (!options)
      throw new Error('Options is required to make a request.');

    options = obj.merge({}, options, {
      strictSSL: false,
      path: options.url,
      json: obj.clone(options.data),
      localhost: serverHttpUrl.href,
      host: serverHttpUrl.host,
      hostname: serverHttpUrl.hostname,
      port: serverHttpUrl.port
    });

    return req.bufferRequest(options);
  };
}