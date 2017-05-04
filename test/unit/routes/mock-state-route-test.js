var proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('mock state route', function () {
  var mockStateRoute, router, mockState, req, res, data, next, response;
  beforeEach(function () {
    router = {
      get: jasmine.createSpy('router.get'),
      route: jasmine.createSpy('router.route')
    };

    router.route.and.returnValue(router);

    data = 'some data';
    response = {
      statusCode: 200,
      headers: {},
      data: 'some data'
    };
    mockState = jasmine.createSpy('mockState').and.returnValue(response);
    mockStateRoute = proxyquire('../../../routes/mock-state-route', {
      '../router': router,
      '../lib/mock-state': mockState
    });

    req = {
      clientReq: {}
    };
    res = {
      clientRes: {}
    };

    next = jasmine.createSpy('next');

    mockStateRoute();
  });

  it('should call router.route', function () {
    expect(router.route).toHaveBeenCalledOnceWith('/api/mockstate');
  });

  it('should call router.get', function () {
    expect(router.get).toHaveBeenCalledOnceWith(jasmine.any(Function));
  });

  describe('handling the route', function () {
    var routeHandler;
    beforeEach(function () {
      routeHandler = router.get.calls.argsFor(0)[0];
      routeHandler(req, res, data, next);
    });

    it('should call mockState', function () {
      expect(mockState).toHaveBeenCalledOnceWith();
    });

    it('should invoke next', function () {
      expect(next).toHaveBeenCalledOnceWith(req, {
        clientRes: {}
      }, {
        statusCode: 200,
        headers: {},
        data: 'some data'
      });
    });
  });
});
