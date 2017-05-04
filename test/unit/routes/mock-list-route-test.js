const proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('mock list route', function() {
  let mockListRoute, router, mockList, req, res, next, response, data;
  beforeEach(function() {
    router = {
      get: jasmine.createSpy('router.get'),
      route: jasmine.createSpy('router.route')
    };

    router.route.and.returnValue(router);

    response = {
      statusCode: 200,
      headers: {},
      data: 'some data'
    };
    mockList = jasmine.createSpy('mockList').and.returnValue(response);
    mockListRoute = proxyquire('../../../routes/mock-list-route', {
      '../router': router,
      '../lib/mock-list': mockList
    });

    req = {
      clientReq: {}
    };
    res = {
      clientRes: {}
    };
    data = 'some data';
    next = jasmine.createSpy('next');

    mockListRoute();
  });

  it('should call router.route', function() {
    expect(router.route).toHaveBeenCalledOnceWith('/api/mocklist');
  });

  it('should call router.get', function() {
    expect(router.get).toHaveBeenCalledOnceWith(jasmine.any(Function));
  });

  describe('handling the route', function() {
    let routeHandler;
    beforeEach(function() {
      routeHandler = router.get.calls.argsFor(0)[0];
      routeHandler(req, res, data, next);
    });

    it('should call mockList', function() {
      expect(mockList).toHaveBeenCalledOnceWith();
    });

    it('should invoke next', function() {
      expect(next).toHaveBeenCalledOnceWith(
        req,
        {
          clientRes: {}
        },
        {
          statusCode: 200,
          headers: {},
          data: 'some data'
        }
      );
    });
  });
});
