import stubDaddyModule from '../../server';
import getReq from '@iml/req';
import * as url from 'url';
import streamToPromise from '../../stream-to-promise.js';

import { describe, beforeEach, it, jasmine, expect } from '../jasmine.js';

const port = 8122;

describe('re-poll test', () => {
  let config, stubDaddy, req, serverHttpUrl;
  beforeEach(() => {
    stubDaddy = stubDaddyModule({ port });
    config = stubDaddy.config;
    req = getReq(config.get('requestProtocol'));
    const urlString = `${config.get('requestProtocol')}://localhost:${port}`;

    serverHttpUrl = url.parse(urlString);

    stubDaddy.webService.startService();
  });

  afterEach(done => {
    stubDaddy.webService.stopService(done.fail, done);
  });

  describe('first call', () => {
    let options, s;
    beforeEach(() => {
      stubDaddy.inlineService.mock({
        request: {
          method: 'GET',
          url: '/api/host/',
          data: {},
          headers: {
            'if-none-match': '1441818174.97'
          }
        },
        response: {
          statusCode: 304,
          headers: {},
          data: {
            objects: []
          }
        },
        dependencies: [],
        expires: 1
      });

      stubDaddy.inlineService.mock({
        request: {
          method: 'GET',
          url: '/api/host/',
          data: {},
          headers: {
            'if-none-match': '1441818174.97'
          }
        },
        response: {
          statusCode: 200,
          headers: {
            ETag: 1441818174.99
          },
          data: {
            objects: [
              {
                foo: 'bar'
              }
            ]
          }
        },
        dependencies: [],
        expires: 1
      });

      options = {
        path: '/api/host/',
        strictSSL: false,
        headers: {
          'If-None-Match': 1441818174.97
        },
        localhost: serverHttpUrl.href,
        host: serverHttpUrl.host,
        hostname: serverHttpUrl.hostname,
        port: serverHttpUrl.port
      };

      s = req.bufferRequest(options);
    });

    it('should return a 304 on the first call', async () => {
      const result = await streamToPromise(s);
      expect(result).toEqual({
        body: '',
        headers: {
          date: jasmine.any(String),
          connection: 'keep-alive'
        },
        statusCode: 304
      });
    });

    it('should return a 200 on the second call', async () => {
      const result = await streamToPromise(
        s.flatMap(req.bufferJsonRequest.bind(null, options))
      );

      expect(result).toEqual({
        body: {
          objects: [
            {
              foo: 'bar'
            }
          ]
        },
        headers: {
          date: jasmine.any(String),
          connection: 'keep-alive',
          'transfer-encoding': 'chunked',
          etag: '1441818174.99'
        },
        statusCode: 200
      });
    });
  });
});
