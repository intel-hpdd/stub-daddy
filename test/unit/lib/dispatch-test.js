const proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('dispatch', function() {
  let dispatch, router, url, verb, clientReq, clientRes, result;

  beforeEach(function() {
    url = '/api/mock';
    verb = 'POST';
    clientReq = {};
    clientRes = {};

    router = {
      go: jasmine.createSpy('router.go')
    };

    dispatch = proxyquire('../../../lib/dispatch', {
      '../router': router
    });

    result = dispatch(url, verb, clientReq, clientRes);
  });

  it('should call router.go', function() {
    expect(router.go).toHaveBeenCalledOnceWith(
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

  it('should return the response', function() {
    const cb = router.go.calls.argsFor(0)[3];

    cb({}, {}, { foo: 'bar' });
    expect(result).toEqual({
      foo: 'bar'
    });
  });
});
