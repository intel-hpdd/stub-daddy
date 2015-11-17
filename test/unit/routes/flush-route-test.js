'use strict';

var proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('flush route', function () {
  var flushRoute, router, flushState, req, res, data, next, response;
  beforeEach(function () {
    router = {
      delete: jasmine.createSpy('router.delete'),
      route: jasmine.createSpy('router.route')
    };

    router.route.and.returnValue(router);

    response = {
      statusCode: 200,
      headers: {}
    };
    flushState = jasmine.createSpy('flushState').and.returnValue(response);
    flushRoute = proxyquire('../../../routes/flush-route', {
      '../router': router,
      '../lib/flush-state': flushState
    });

    req = {
      clientReq: {}
    };
    res = {
      clientRes: {}
    };
    data = 'some data';
    next = jasmine.createSpy('next');

    flushRoute();
  });

  it('should call router.route', function () {
    expect(router.route).toHaveBeenCalledOnceWith('/api/flush');
  });

  it('should call router.delete', function () {
    expect(router.delete).toHaveBeenCalledOnceWith(jasmine.any(Function));
  });

  describe('handling the route', function () {
    var routeHandler;
    beforeEach(function () {
      routeHandler = router.delete.calls.argsFor(0)[0];
      routeHandler(req, res, data, next);
    });

    it('should call flushState', function () {
      expect(flushState).toHaveBeenCalledOnceWith();
    });

    it('should invoke next', function () {
      expect(next).toHaveBeenCalledOnceWith(req, {
        clientRes: {}
      }, {
        statusCode: 200,
        headers: {}
      });
    });
  });
});
