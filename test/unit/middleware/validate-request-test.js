var proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('validate request', function () {
  var requestValidator, validateRequest, req, res, body, next;
  beforeEach(function () {
    requestValidator = jasmine.createSpy('requestValidator');

    req = {
      clientReq : {
        url: '/user/profile'
      }
    };
    res = {};
    body = {foo: 'bar'};
    next = jasmine.createSpy('next');

    validateRequest = proxyquire('../../../middleware/validate-request', {
      '../validators/request-validator': requestValidator
    });
  });

  it('should call next with the body if validation passes', function () {
    requestValidator.and.returnValue({
      errors: []
    });

    validateRequest(req, res, body, next);

    expect(next).toHaveBeenCalledOnceWith(req, res, body);
  });

  it('should throw an error if validation does not pass', function () {
    requestValidator.and.returnValue({
      errors: ['error']
    });

    expect(function () {
      validateRequest(req, res, body, next);
    }).toThrow(jasmine.any(Error));
  });
});
