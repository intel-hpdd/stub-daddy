'use strict';

var afterTimeout = require('../../../middleware/after-timeout');

describe('after timeout', function () {
  var req, res, data;
  beforeEach(function () {
    res = {
      clientRes: {}
    };
    data = {foo: 'bar'};
  });

  describe('with a timeout', function () {
    beforeEach(function () {
      req = {
        timeout: 500
      };
    });

    it('should pass the request to next asynchronously', function (done) {
      afterTimeout(req, res, data, function (request) {
        expect(request).toEqual(req);
        done();
      });
    });

    it('should pass the response to next', function (done) {
      afterTimeout(req, res, data, function (request, response) {
        expect(response).toEqual({
          clientRes: {}
        });
        done();
      });
    });

    it('should pass the data to next', function (done) {
      afterTimeout(req, res, data, function (request, response, data) {
        expect(data).toEqual({
          foo: 'bar'
        });
        done();
      });
    });
  });

  describe('without a timeout', function () {
    var next;
    beforeEach(function () {
      req = {};
      next = jasmine.createSpy('next');

      afterTimeout(req, res, data, next);
    });

    it('should call next with the request and response', function () {
      expect(next).toHaveBeenCalledOnceWith({}, {
        clientRes: {}
      }, {
        foo: 'bar'
      });
    });
  });
});