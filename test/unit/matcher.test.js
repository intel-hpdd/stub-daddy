import * as url from 'url';
import * as obj from '@iml/obj';

import { describe, beforeEach, it, expect, jest } from '../jasmine.js';

describe('test matcher module', () => {
  let requestMatcher, incomingRequest, registeredRequest, mockUrl;

  beforeEach(() => {
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

    registeredRequest = {
      method: 'GET',
      url: '/some/path',
      data: registeredData,
      qs: {},
      headers: registeredHeaders
    };

    mockUrl = {
      parse: jasmine.createSpy('parse').and.callFake(url.parse)
    };

    jest.mock('url', () => mockUrl);

    requestMatcher = require('../../matcher.js').default;
  });

  it('should match with required properties and extra properties in incoming request', () => {
    const result = requestMatcher(incomingRequest)(registeredRequest);

    expect(result).toBeTruthy();
  });

  it('should not match if the required parameters in the querystring do not match', () => {
    registeredRequest.qs.name = 'will';

    const result = requestMatcher(incomingRequest)(registeredRequest);

    expect(result).toBeFalsy();
  });

  it('should match if the required parameters in the querystring match', () => {
    registeredRequest.qs.name = 'will';
    incomingRequest.qs.name = 'will';
    incomingRequest.qs.hobbies = 'surfing';

    const result = requestMatcher(incomingRequest)(registeredRequest);

    expect(result).toBeTruthy();
  });

  it('should match with required properties and NO extra properties in incoming request', () => {
    incomingRequest.data = obj.clone(registeredRequest.data);
    incomingRequest.headers = obj.clone(registeredRequest.headers);

    const result = requestMatcher(incomingRequest)(registeredRequest);

    expect(result).toBeTruthy();
  });

  it('should NOT match because one of the required data properties is not in the incoming request', () => {
    registeredRequest.data.extraParam = 'extra param value';

    // In order for this to pass, the incoming request would need to have 'extraParam' on
    // the data property. But it doesn't, so this should fail.
    const result = requestMatcher(incomingRequest)(registeredRequest);

    expect(result).toBeFalsy();
  });

  it('should NOT match because one of the required header properties is not in the incoming request', () => {
    registeredRequest.headers.extraParam = 'extra param value';

    // In order for this to pass, the incoming request would need to have 'extraParam' on
    // the headers property. But it doesn't, so this should fail.
    const result = requestMatcher(incomingRequest)(registeredRequest);

    expect(result).toBeFalsy();
  });

  it('should NOT match because the method does not match', () => {
    registeredRequest.method = 'POST';

    // The incoming request method is GET so this doesn't match.
    const result = requestMatcher(incomingRequest)(registeredRequest);

    expect(result).toBeFalsy();
  });

  it('should NOT match because the url does not match', () => {
    registeredRequest.url = 'bla';

    // The incoming request is /some/path so this doesn't match.
    const result = requestMatcher(incomingRequest)(registeredRequest);

    expect(result).toBeFalsy();
  });

  it('should call url.parse', () => {
    requestMatcher(incomingRequest)(registeredRequest);
    expect(mockUrl.parse).toHaveBeenCalled();
  });
});
