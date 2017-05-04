var proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('server test', function () {
  var instance, stubDaddy, clearRequireCache, routes;

  beforeEach(function () {
    clearRequireCache = jasmine.createSpy('clearRequireCache');
    routes = {
      route1: jasmine.createSpy('route1'),
      route2: jasmine.createSpy('route2')
    };

    stubDaddy = proxyquire('../../server', {
      './clear-require-cache': clearRequireCache,
      './routes': routes
    });
    instance = stubDaddy();
  });

  it('should invoke the cache manager', function () {
    expect(clearRequireCache).toHaveBeenCalledOnce();
  });

  it('should invoke route1', function () {
    expect(routes.route1).toHaveBeenCalledOnceWith();
  });

  it('should invoke route2', function () {
    expect(routes.route2).toHaveBeenCalledOnceWith();
  });

  it('should set the request to https by default', function () {
    expect(instance.config.get('requestProtocol')).toEqual('https');
  });

  it('should set the request to http if specified', function () {
    instance = stubDaddy({requestProtocol: 'http'});
    expect(instance.config.get('requestProtocol')).toEqual('http');
  });

  it('should have a config object', function () {
    expect(instance.config).toEqual(jasmine.any(Object));
  });

  it('should have a webService function', function () {
    expect(instance.webService).toEqual(jasmine.any(Object));
  });

  it('should have an inlineService function', function () {
    expect(instance.inlineService).toEqual(jasmine.any(Object));
  });

  it('should have a validator function', function () {
    expect(instance.validator).toEqual(jasmine.any(Function));
  });
});
