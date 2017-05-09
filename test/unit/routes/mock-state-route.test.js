import {
  describe,
  beforeEach,
  it,
  jasmine,
  expect,
  jest
} from '../../jasmine.js';

describe('mock state route', () => {
  let mockStateRoute,
    mockRouter,
    mockState,
    req,
    res,
    data,
    next,
    response,
    entries,
    mockStatus;
  beforeEach(() => {
    mockRouter = {
      get: jasmine.createSpy('router.get'),
      route: jasmine.createSpy('router.route')
    };

    mockRouter.route.and.returnValue(mockRouter);

    data = 'some data';
    response = {
      statusCode: 200,
      headers: {},
      data: 'some data'
    };
    mockState = jasmine.createSpy('mockState').and.returnValue(response);

    jest.mock('../lib/mock-state.js', () => mockState);

    mockStateRoute = require('../../../routes/mock-state-route').default;

    req = {
      clientReq: {}
    };
    res = {
      clientRes: {}
    };

    next = jasmine.createSpy('next');
    entries = [];
    mockStatus = 'mockStatus';

    mockStateRoute(mockRouter, entries, mockStatus);
  });

  it('should call router.route', () => {
    expect(mockRouter.route).toHaveBeenCalledOnceWith('/api/mockstate');
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

    it('should call mockState', () => {
      expect(mockState).toHaveBeenCalledOnceWith(entries, mockStatus);
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
