import {
  describe,
  beforeEach,
  it,
  jasmine,
  expect,
  jest
} from '../../jasmine.js';

describe('mock list route', () => {
  let mockListRoute,
    mockRouter,
    mockList,
    req,
    res,
    next,
    response,
    data,
    entries;
  beforeEach(() => {
    mockRouter = {
      get: jasmine.createSpy('router.get'),
      route: jasmine.createSpy('router.route')
    };

    mockRouter.route.and.returnValue(mockRouter);

    response = {
      statusCode: 200,
      headers: {},
      data: 'some data'
    };
    mockList = jasmine.createSpy('mockList').and.returnValue(response);

    jest.mock('../lib/mock-list.js', () => mockList);

    mockListRoute = require('../../../routes/mock-list-route').default;

    req = {
      clientReq: {}
    };
    res = {
      clientRes: {}
    };
    data = 'some data';
    next = jasmine.createSpy('next');
    entries = [];

    mockListRoute(mockRouter, entries);
  });

  it('should call router.route', () => {
    expect(mockRouter.route).toHaveBeenCalledOnceWith('/api/mocklist');
  });

  it('should call router.get', () => {
    expect(mockRouter.get).toHaveBeenCalledOnceWith(jasmine.any(Function));
  });

  describe('handling the route', () => {
    let routeHandler;
    beforeEach(() => {
      routeHandler = mockRouter.get.calls.argsFor(0)[0];
      routeHandler(req, res, data, next);
    });

    it('should call mockList', () => {
      expect(mockList).toHaveBeenCalledOnceWith(entries);
    });

    it('should invoke next', () => {
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
