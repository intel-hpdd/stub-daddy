const fp = require('@mfl/fp');
const obj = require('@mfl/obj');
const stubDaddy = require('../../server');
const fixtures = require('../fixtures/standard-fixtures');

describe('web service', function() {
  let webService, instance, spy;

  beforeEach(function() {
    spy = jasmine.createSpy('spy');
    instance = stubDaddy();
    webService = instance.webService;
  });

  describe('starting the service', function() {
    let count, spy2;
    beforeEach(function(done) {
      spy2 = jasmine.createSpy('spy2');
      webService.startService();
      count = webService.getConnectionCount();

      webService.stopService(done.fail, done);
    });

    it('should have 0 connections', function() {
      expect(count).toEqual(0);
    });
  });

  describe('multiple services', function() {
    let instance2, webService2;
    beforeEach(function() {
      webService.startService();

      instance2 = stubDaddy({ port: 8127 });
      webService2 = instance2.webService;
      webService2.startService();

      instance.inlineService.mock(
        fixtures.integration.registerSuccessfulMockRequest.json.json
      );
      instance.inlineService.makeRequest(
        obj.clone(
          fixtures.integration.registerSuccessfulMockRequest.json.json.request
        )
      );
      instance2.inlineService.mock(
        fixtures.integration.registerSuccessfulMockPOSTRequest.json.json
      );
    });

    afterEach(function(done) {
      webService.stopService(done.fail, function() {
        webService2.stopService(done.fail, done);
      });
    });

    it('should reflect a successful mock state on the first instance', function() {
      expect(instance.inlineService.mockState()).toEqual({
        statusCode: 200,
        data: [],
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });

    it('should reflect a 400 mock state on the second instance', function() {
      expect(function() {
        instance2.inlineService.mockState();
      }).toThrow(jasmine.any(Error));
    });
  });
});
