import {
  describe,
  beforeEach,
  it,
  jasmine,
  expect,
  jest
} from '../../jasmine.js';

describe('validate mock', () => {
  let mockRegisterApiValidator, validateMock, req, res, body, next;
  beforeEach(() => {
    mockRegisterApiValidator = jasmine.createSpy('registerApiValidator');

    req = {};
    res = {};
    body = { foo: 'bar' };
    next = jasmine.createSpy('next');

    jest.mock(
      '../validators/register-api-validator.js',
      () => mockRegisterApiValidator
    );

    validateMock = require('../../../middleware/validate-mock').default;
  });

  it('should call next with the body if validation passes', () => {
    mockRegisterApiValidator.and.returnValue({
      errors: []
    });

    validateMock(req, res, body, next);

    expect(next).toHaveBeenCalledOnceWith(req, res, body);
  });

  it('should throw an error if validation does not pass', () => {
    mockRegisterApiValidator.and.returnValue({
      errors: ['error']
    });

    expect(() => {
      validateMock(req, res, body, next);
    }).toThrow(jasmine.any(Error));
  });
});
