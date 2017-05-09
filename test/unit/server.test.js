import { describe, beforeEach, it, jasmine, expect, jest } from '../jasmine.js';

describe('server test', function() {
  let instance,
    stubDaddy,
    mockRoutes,
    mockStatus,
    mockStatusFactory,
    mockRouterFactory,
    router;

  beforeEach(function() {
    mockRoutes = {
      route1: jasmine.createSpy('route1'),
      route2: jasmine.createSpy('route2')
    };

    mockStatus = 'mockStatus';

    mockStatusFactory = jasmine
      .createSpy('mockStatus')
      .and.returnValue(mockStatus);

    router = 'router';
    mockRouterFactory = jasmine.createSpy('router').and.returnValue(router);

    jest.mock('../routes', () => mockRoutes);
    jest.mock('../lib/mock-status.js', () => mockStatusFactory);
    jest.mock('../router.js', () => mockRouterFactory);

    stubDaddy = require('../../server.js').default;
    instance = stubDaddy({});
  });

  it('should create a new mockStatus', () => {
    expect(mockStatusFactory).toHaveBeenCalledOnce();
  });

  it('should create a new router instance', () => {
    expect(mockRouterFactory).toHaveBeenCalledOnce();
  });

  it('should invoke route1', function() {
    expect(mockRoutes.route1).toHaveBeenCalledOnceWith(
      router,
      jasmine.any(Array),
      mockStatus
    );
  });

  it('should invoke route2', function() {
    expect(mockRoutes.route2).toHaveBeenCalledOnceWith(
      router,
      jasmine.any(Array),
      mockStatus
    );
  });

  it('should set the request to https by default', function() {
    expect(instance.config.get('requestProtocol')).toEqual('https');
  });

  it('should set the request to http if specified', function() {
    instance = stubDaddy({ requestProtocol: 'http' });
    expect(instance.config.get('requestProtocol')).toEqual('http');
  });

  it('should have a config object', function() {
    expect(instance.config).toEqual(jasmine.any(Object));
  });

  it('should have a webService function', function() {
    expect(instance.webService).toEqual(jasmine.any(Object));
  });

  it('should have an inlineService function', function() {
    expect(instance.inlineService).toEqual(jasmine.any(Object));
  });

  it('should have a validator function', function() {
    expect(instance.validator).toEqual(jasmine.any(Function));
  });
});
