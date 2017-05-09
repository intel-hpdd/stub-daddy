import {
  describe,
  beforeEach,
  it,
  jasmine,
  expect,
  jest
} from '../../jasmine.js';

describe('wildcard route', () => {
  let wildcardRoute,
    mockRouter,
    mockDynamicRequest,
    req,
    res,
    data,
    next,
    response,
    mockAfterTimeout,
    entries,
    mockStatus,
    mockValidateRequest;
  beforeEach(() => {
    mockRouter = {
      all: jasmine.createSpy('router.all'),
      route: jasmine.createSpy('router.route')
    };

    mockRouter.route.and.returnValue(mockRouter);
    mockRouter.all.and.returnValue(mockRouter);

    data = 'some data';
    response = {
      statusCode: 200,
      headers: {},
      data: data
    };

    mockAfterTimeout = jasmine.createSpy('afterTimeout');
    mockValidateRequest = jasmine.createSpy('validateRequest');

    mockDynamicRequest = jasmine.createSpy('dynamicRequest');

    jest.mock('../lib/dynamic-request.js', () => mockDynamicRequest);
    jest.mock('../middleware/after-timeout.js', () => mockAfterTimeout);
    jest.mock('../middleware/validate-request.js', () => mockValidateRequest);

    wildcardRoute = require('../../../routes/wildcard-route').default;

    req = {
      clientReq: {}
    };
    res = {
      clientRes: {}
    };

    next = jasmine.createSpy('next');
    entries = [];
    mockStatus = {
      getMockApiState: jasmine.createSpy('getMockApiState')
    };

    wildcardRoute(mockRouter, entries, mockStatus);
  });

  it('should call router.route', () => {
    expect(mockRouter.route).toHaveBeenCalledOnceWith('(.*)');
  });

  it('should call router.all', () => {
    expect(mockRouter.all).toHaveBeenCalledThriceWith(jasmine.any(Function));
  });

  it('should call router.all with afterTimeout', () => {
    expect(mockRouter.all).toHaveBeenCalledOnceWith(mockAfterTimeout);
  });

  it('should call router.all with validateRequest', () => {
    expect(mockRouter.all).toHaveBeenCalledOnceWith(mockValidateRequest);
  });

  describe('handling the route', () => {
    let routeHandler;

    beforeEach(() => {
      routeHandler = mockRouter.all.calls.argsFor(1)[0];
    });

    describe('with an entry', () => {
      beforeEach(() => {
        mockDynamicRequest.and.returnValue({
          response: response,
          timeout: 500
        });
        routeHandler(req, res, data, next);
      });

      it('should call dynamicRequest', () => {
        expect(mockDynamicRequest).toHaveBeenCalledOnceWith(
          req.clientReq,
          data,
          entries,
          mockStatus
        );
      });

      it('should invoke next', () => {
        expect(next).toHaveBeenCalledOnceWith(
          {
            clientReq: {},
            timeout: 500
          },
          {
            clientRes: {}
          },
          {
            statusCode: 200,
            headers: {},
            data: data
          }
        );
      });
    });

    describe('without an entry', () => {
      beforeEach(() => {
        mockDynamicRequest.and.returnValue(undefined);
        mockStatus.getMockApiState.and.returnValue({});
      });

      it('should call mockStatus.getMockApiState', () => {
        try {
          routeHandler(req, res, data, next);
        } catch (e) {
          expect(e).toEqual(new Error('Entry not found. Mock state is: {}'));
        } finally {
          expect(mockStatus.getMockApiState).toHaveBeenCalledOnceWith(entries);
        }
      });
    });
  });
});
