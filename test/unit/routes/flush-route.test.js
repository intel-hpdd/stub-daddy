import {
  describe,
  beforeEach,
  it,
  jasmine,
  expect,
  jest
} from '../../jasmine.js';

describe('flush route', () => {
  let flushRoute,
    mockRouter,
    mockFlushState,
    mockStatus,
    req,
    res,
    data,
    next,
    response,
    entries;
  beforeEach(() => {
    mockRouter = {
      delete: jasmine.createSpy('router.delete'),
      route: jasmine.createSpy('router.route')
    };

    mockRouter.route.and.returnValue(mockRouter);

    response = {
      statusCode: 200,
      headers: {}
    };
    mockFlushState = jasmine.createSpy('flushState').and.returnValue(response);

    jest.mock('../lib/flush-state.js', () => mockFlushState);

    flushRoute = require('../../../routes/flush-route').default;

    req = {
      clientReq: {}
    };
    res = {
      clientRes: {}
    };
    data = 'some data';
    next = jasmine.createSpy('next');
    entries = [];
    mockStatus = 'mockStatus';

    flushRoute(mockRouter, entries, mockStatus);
  });

  it('should call router.route', () => {
    expect(mockRouter.route).toHaveBeenCalledOnceWith('/api/flush');
  });

  it('should call router.delete', () => {
    expect(mockRouter.delete).toHaveBeenCalledOnceWith(jasmine.any(Function));
  });

  describe('handling the route', () => {
    let routeHandler;
    beforeEach(() => {
      routeHandler = mockRouter.delete.calls.argsFor(0)[0];
      routeHandler(req, res, data, next);
    });

    it('should call flushState', () => {
      expect(mockFlushState).toHaveBeenCalledOnceWith(entries, mockStatus);
    });

    it('should invoke next', () => {
      expect(next).toHaveBeenCalledOnceWith(
        req,
        {
          clientRes: {}
        },
        {
          statusCode: 200,
          headers: {}
        }
      );
    });
  });
});
