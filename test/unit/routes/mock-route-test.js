'use strict';

var proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('mock route', function () {
  var mockRoute, router, registerApi, req, res, data, next, response, validateMock;
  beforeEach(function () {
    router = {
      post: jasmine.createSpy('router.post'),
      route: jasmine.createSpy('router.route')
    };

    router.route.and.returnValue(router);
    router.post.and.returnValue(router);

    response = {
      statusCode: 200,
      headers: {}
    };

    validateMock = jasmine.createSpy('validateMock');

    registerApi = jasmine.createSpy('registerApi').and.returnValue(response);
    mockRoute = proxyquire('../../../routes/mock-route', {
      '../router': router,
      '../lib/register-api': registerApi,
      '../middleware/validate-mock': validateMock
    });

    req = {
      clientReq: {}
    };
    res = {
      clientRes: {}
    };
    data = 'some data';
    next = jasmine.createSpy('next');

    mockRoute();
  });

  it('should call router.route', function () {
    expect(router.route).toHaveBeenCalledOnceWith('/api/mock');
  });

  it('should call router.post with validateMock', function () {
    expect(router.post).toHaveBeenCalledOnceWith(validateMock);
  });

  describe('handling the route', function () {
    var routeHandler;
    beforeEach(function () {
      routeHandler = router.post.calls.argsFor(1)[0];
      routeHandler(req, res, data, next);
    });

    it('should call registerApi', function () {
      expect(registerApi).toHaveBeenCalledOnceWith(data);
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
