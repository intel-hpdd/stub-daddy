'use strict';

var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var format = require('util').format;

describe('handle error middleware', function () {
  var req, res, data, next, mockStatus, handleError, entryNotFound, entryNotFoundString,
    requestError, requestErrorString;
  beforeEach(function () {
    req = {};
    res = {};
    next = jasmine.createSpy('next');
    entryNotFound = [{foo: 'bar'}];
    entryNotFoundString = JSON.stringify(entryNotFound, null, 2);

    requestError = {
      statusCode: 400,
      data: {foo: 'bar'}
    };
    requestErrorString = JSON.stringify(requestError, null, 2);

    mockStatus = {
      getMockApiState: jasmine.createSpy('mockStatus').and.returnValue(entryNotFound)
    };

    handleError = proxyquire('../../../middleware/handle-error', {
      '../lib/mock-status': mockStatus
    });
  });

  it('should throw an Entry not found error when statusCode is 404', function () {
    data = {
      statusCode: 404
    };

    expect(handleError.bind(null, req, res, data, next)).toThrow(new Error (format('Entry not found. Mock state is: %s',
      entryNotFoundString)));
  });

  it('should throw an error with the data when the statusCode is >= 400', function () {
    data = {
      statusCode: 400,
      data: {foo: 'bar'}
    };

    expect(handleError.bind(null, req, res, data, next)).toThrow(new Error (
      format('There was an error with the request. The response is: %s and the mock state is %s',
        requestErrorString, entryNotFoundString)));
  });

  describe('handling a response less than 400', function () {
    var result;
    beforeEach(function () {
      data = {
        statusCode: 200
      };

      result = handleError(req, res, data, next);
    });

    it('should call next', function () {
      expect(next).toHaveBeenCalledOnceWith(req, res, data);
    });

    it('should not return anything', function () {
      expect(result).toBeUndefined();
    });
  });
});
