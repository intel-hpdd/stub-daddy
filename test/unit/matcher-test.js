const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
import url from 'url';
import * as obj from '@mfl/obj';

describe('test matcher module', function() {
  let requestMatcher, incomingRequest, registeredRequest;

  beforeEach(function() {
    const data1 = {
      item1: 'item1 value',
      item2: 'item2 value'
    };
    const headers1 = {
      host: 'localhost:8888',
      connection: 'keep-alive',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko)',
      'content-type': 'text/plain; charset=utf-8',
      accept: '*/*',
      'accept-encoding': 'gzip,deflate,sdch',
      'accept-language': 'en-US,en;q=0.8',
      cookie: 'm=34e2:; csrftoken=Di8V2cFIUliMJVr0tNb8E4SrwCp5QMdg; sessionid=d2fa382c8a220126c1315c94af4bb42c',
      custom: 'my custom header',
      custom2: 'my custom header2'
    };

    incomingRequest = {
      method: 'GET',
      url: '/some/path',
      data: data1,
      qs: {},
      headers: headers1
    };

    const registeredData = {
      item2: 'item2 value'
    };
    const registeredHeaders = {
      custom: 'my custom header'
    };

    spyOn(url, 'parse').and.callThrough();

    registeredRequest = {
      method: 'GET',
      url: '/some/path',
      data: registeredData,
      qs: {},
      headers: registeredHeaders
    };

    requestMatcher = proxyquire('../../matcher', {});
  });

  it('should match with required properties and extra properties in incoming request', function() {
    const result = requestMatcher(incomingRequest, registeredRequest);

    expect(result).toBeTruthy();
  });

  it('should not match if the required parameters in the querystring do not match', function() {
    registeredRequest.qs.name = 'will';

    const result = requestMatcher(incomingRequest, registeredRequest);

    expect(result).toBeFalsy();
  });

  it('should match if the required parameters in the querystring match', function() {
    registeredRequest.qs.name = 'will';
    incomingRequest.qs.name = 'will';
    incomingRequest.qs.hobbies = 'surfing';

    const result = requestMatcher(incomingRequest, registeredRequest);

    expect(result).toBeTruthy();
  });

  it('should match with required properties and NO extra properties in incoming request', function() {
    incomingRequest.data = obj.clone(registeredRequest.data);
    incomingRequest.headers = obj.clone(registeredRequest.headers);

    const result = requestMatcher(incomingRequest, registeredRequest);

    expect(result).toBeTruthy();
  });

  it('should NOT match because one of the required data properties is not in the incoming request', function() {
    registeredRequest.data.extraParam = 'extra param value';

    // In order for this to pass, the incoming request would need to have 'extraParam' on
    // the data property. But it doesn't, so this should fail.
    const result = requestMatcher(incomingRequest, registeredRequest);

    expect(result).toBeFalsy();
  });

  it('should NOT match because one of the required header properties is not in the incoming request', function() {
    registeredRequest.headers.extraParam = 'extra param value';

    // In order for this to pass, the incoming request would need to have 'extraParam' on
    // the headers property. But it doesn't, so this should fail.
    const result = requestMatcher(incomingRequest, registeredRequest);

    expect(result).toBeFalsy();
  });

  it('should NOT match because the method does not match', function() {
    registeredRequest.method = 'POST';

    // The incoming request method is GET so this doesn't match.
    const result = requestMatcher(incomingRequest, registeredRequest);

    expect(result).toBeFalsy();
  });

  it('should NOT match because the url does not match', function() {
    registeredRequest.url = 'bla';

    // The incoming request is /some/path so this doesn't match.
    const result = requestMatcher(incomingRequest, registeredRequest);

    expect(result).toBeFalsy();
  });

  it('should call url.parse', function() {
    requestMatcher(incomingRequest, registeredRequest);
    expect(url.parse).toHaveBeenCalled();
  });
});
