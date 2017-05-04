var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var config = require('../../../config');

describe('wildcard route', function () {
  var wildcardRoute, router, dynamicRequest, req, res, data, next, response, afterTimeout, validateRequest;
  beforeEach(function () {
    router = {
      all: jasmine.createSpy('router.all'),
      route: jasmine.createSpy('router.route')
    };

    router.route.and.returnValue(router);
    router.all.and.returnValue(router);

    data = 'some data';
    response = {
      statusCode: 200,
      headers: {},
      data: data
    };

    afterTimeout = jasmine.createSpy('afterTimeout');
    validateRequest = jasmine.createSpy('validateRequest');

    dynamicRequest = jasmine.createSpy('dynamicRequest');
    wildcardRoute = proxyquire('../../../routes/wildcard-route', {
      '../router': router,
      '../lib/dynamic-request': dynamicRequest,
      '../middleware/after-timeout': afterTimeout,
      '../middleware/validate-request': validateRequest
    });

    req = {
      clientReq: {}
    };
    res = {
      clientRes: {}
    };

    next = jasmine.createSpy('next');

    wildcardRoute();
  });

  it('should call router.route', function () {
    expect(router.route).toHaveBeenCalledOnceWith('(.*)');
  });

  it('should call router.all', function () {
    expect(router.all).toHaveBeenCalledThriceWith(jasmine.any(Function));
  });

  it('should call router.all with afterTimeout', function () {
    expect(router.all).toHaveBeenCalledOnceWith(afterTimeout);
  });

  it('should call router.all with validateRequest', function () {
    expect(router.all).toHaveBeenCalledOnceWith(validateRequest);
  });

  describe('handling the route', function () {
    var routeHandler;

    beforeEach(function () {
      routeHandler = router.all.calls.argsFor(1)[0];
    });

    describe('with an entry', function () {
      beforeEach(function () {
        dynamicRequest.and.returnValue({
          response: response,
          timeout: 500
        });
        routeHandler(req, res, data, next);
      });

      it('should call dynamicRequest', function () {
        expect(dynamicRequest).toHaveBeenCalledOnceWith(req.clientReq, data);
      });

      it('should invoke next', function () {
        expect(next).toHaveBeenCalledOnceWith({
          clientReq: {},
          timeout: 500
        }, {
          clientRes: {}
        }, {
          statusCode: 200,
          headers: {},
          data: data
        });
      });
    });

    describe('without an entry', function () {
      beforeEach(function () {
        dynamicRequest.and.returnValue(undefined);
      });

      it('should throw an error', function () {
        expect(function () {
          routeHandler(req, res, data, next);
        }).toThrow(jasmine.any(Error));
      });
    });
  });
});
