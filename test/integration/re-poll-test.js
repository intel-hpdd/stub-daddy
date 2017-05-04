import stubDaddyModule from '../../server';
import { format } from 'util';
import getReq from '@mfl/req';
import url from 'url';

describe('re-poll test', function() {
  let config, stubDaddy, req, serverHttpUrl, spy;
  beforeEach(function() {
    stubDaddy = stubDaddyModule();
    config = stubDaddy.config;
    req = getReq(config.get('requestProtocol'));
    const urlString = format(
      '%s://localhost:%s',
      config.get('requestProtocol'),
      config.get('port')
    );
    serverHttpUrl = url.parse(urlString);

    stubDaddy.webService.startService();
  });

  afterEach(function(done) {
    stubDaddy.webService.stopService(done.fail, done);
  });

  describe('first call', function() {
    let options, s;
    beforeEach(function() {
      spy = jasmine.createSpy('spy');

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

    it('should return a 304 on the first call', function(done) {
      s.errors(done.fail).each(spy).done(function() {
        expect(spy).toHaveBeenCalledOnceWith({
          body: null,
          headers: {
            date: jasmine.any(String),
            connection: 'keep-alive'
          },
          statusCode: 304
        });
        done();
      });
    });

    it('should return a 200 on the second call', function(done) {
      s
        .flatMap(req.bufferRequest.bind(null, options))
        .errors(done.fail)
        .each(spy)
        .done(function() {
          expect(spy).toHaveBeenCalledOnceWith({
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
          done();
        });
    });
  });
});
