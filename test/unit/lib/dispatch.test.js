import { describe, beforeEach, it, jasmine, expect } from '../../jasmine.js';

describe('dispatch', () => {
  let dispatch, mockRouter, url, verb, clientReq, clientRes, result;

  beforeEach(() => {
    url = '/api/mock';
    verb = 'POST';
    clientReq = {};
    clientRes = {};

    mockRouter = {
      go: jasmine.createSpy('router.go')
    };

    dispatch = require('../../../lib/dispatch.js').default;

    result = dispatch(mockRouter)(url, verb, clientReq, clientRes);
  });

  it('should call router.go', () => {
    expect(mockRouter.go).toHaveBeenCalledOnceWith(
      url,
      {
        verb: verb,
        clientReq: clientReq
      },
      {
        clientRes: clientRes
      },
      jasmine.any(Function)
    );
  });

  it('should return the response', () => {
    const cb = mockRouter.go.calls.argsFor(0)[3];

    cb({}, {}, { foo: 'bar' });
    expect(result).toEqual({
      foo: 'bar'
    });
  });
});
