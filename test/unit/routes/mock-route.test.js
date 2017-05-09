import {
  describe,
  beforeEach,
  it,
  jasmine,
  expect,
  jest
} from '../../jasmine.js';

describe('mock route', () => {
  let mockRoute,
    mockRouter,
    mockRegisterApi,
    req,
    res,
    data,
    next,
    response,
    entries,
    mockValidateMock;
  beforeEach(() => {
    mockRouter = {
      post: jasmine.createSpy('router.post'),
      route: jasmine.createSpy('router.route')
    };

    mockRouter.route.and.returnValue(mockRouter);
    mockRouter.post.and.returnValue(mockRouter);

    response = {
      statusCode: 200,
      headers: {}
    };

    mockValidateMock = jasmine.createSpy('validateMock');

    mockRegisterApi = jasmine
      .createSpy('registerApi')
      .and.returnValue(response);

    jest.mock('../lib/register-api.js', () => mockRegisterApi);
    jest.mock('../middleware/validate-mock.js', () => mockValidateMock);

    mockRoute = require('../../../routes/mock-route').default;

    req = {
      clientReq: {}
    };
    res = {
      clientRes: {}
    };
    data = 'some data';
    next = jasmine.createSpy('next');
    entries = [];

    mockRoute(mockRouter, entries);
  });

  it('should call router.route', () => {
    expect(mockRouter.route).toHaveBeenCalledOnceWith('/api/mock');
  });

  it('should call router.post with validateMock', () => {
    expect(mockRouter.post).toHaveBeenCalledOnceWith(mockValidateMock);
  });

  describe('handling the route', () => {
    let routeHandler;
    beforeEach(() => {
      routeHandler = mockRouter.post.calls.argsFor(1)[0];
      routeHandler(req, res, data, next);
    });

    it('should call registerApi', () => {
      expect(mockRegisterApi).toHaveBeenCalledOnceWith(data, entries);
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
