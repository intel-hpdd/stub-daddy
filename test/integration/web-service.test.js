import * as obj from '@mfl/obj';
import stubDaddy from '../../server';
import fixtures from '../fixtures/standard-fixtures';

import { describe, beforeEach, it, expect } from '../jasmine.js';

const port1 = 8123;
const port2 = 8124;

describe('web service', () => {
  let webService, instance;

  beforeEach(() => {
    instance = stubDaddy({ port: port1 });
    webService = instance.webService;
  });

  describe('starting the service', () => {
    let count;
    beforeEach(done => {
      webService.startService();
      count = webService.getConnectionCount();

      webService.stopService(done.fail, done);
    });

    it('should have 0 connections', () => {
      expect(count).toEqual(0);
    });
  });

  describe('multiple services', () => {
    let instance2, webService2;
    beforeEach(() => {
      webService.startService();

      instance2 = stubDaddy({ port: port2 });
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

    afterEach(done => {
      webService.stopService(done.fail, () => {
        webService2.stopService(done.fail, done);
      });
    });

    it('should reflect a successful mock state on the first instance', () => {
      expect(instance.inlineService.mockState()).toEqual({
        statusCode: 200,
        data: [],
        headers: {
          'Content-Type': 'application/json'
        }
      });
    });

    it('should reflect a 400 mock state on the second instance', () => {
      expect(() => {
        instance2.inlineService.mockState();
      }).toThrow(jasmine.any(Error));
    });
  });
});
