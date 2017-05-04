var proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('to json middleware', function () {
  var toJson, logger, req, res, data, next;
  beforeEach(function () {
    logger = jasmine.createSpy('logger');
    toJson = proxyquire('../../../middleware/to-json', {
      '../logger': logger
    });

    req = {};
    res = {};
    data = '{"name":"will"}';
    next = jasmine.createSpy('next');
    toJson(req, res, data, next);
  });

  it('should call next with parsed data', function () {
    expect(next).toHaveBeenCalledOnceWith(req, res, {name: 'will'});
  });
});
