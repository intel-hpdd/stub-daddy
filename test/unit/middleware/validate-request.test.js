import {
  describe,
  beforeEach,
  it,
  jasmine,
  expect,
  jest
} from '../../jasmine.js';

describe('validate request', () => {
  let mockRequestValidator, validateRequest, req, res, body, next;
  beforeEach(() => {
    mockRequestValidator = jasmine.createSpy('requestValidator');

    req = {
      clientReq: {
        url: '/user/profile'
      }
    };
    res = {};
    body = { foo: 'bar' };
    next = jasmine.createSpy('next');

    jest.mock('../validators/request-validator.js', () => mockRequestValidator);

    validateRequest = require('../../../middleware/validate-request').default;
  });

  it('should call next with the body if validation passes', () => {
    mockRequestValidator.and.returnValue({
      errors: []
    });

    validateRequest(req, res, body, next);

    expect(next).toHaveBeenCalledOnceWith(req, res, body);
  });

  it('should throw an error if validation does not pass', () => {
    mockRequestValidator.and.returnValue({
      errors: ['error']
    });

    expect(() => {
      validateRequest(req, res, body, next);
    }).toThrow(jasmine.any(Error));
  });
});
