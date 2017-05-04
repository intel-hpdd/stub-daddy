var proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('mock list', function () {
  var mockList, config, entries;
  beforeEach(function () {
    config = require('../../../config');
    entries = ['entries'];
    mockList = proxyquire('../../../lib/mock-list', {
      './entries': entries
    });
  });

  describe('GET request', function () {
    var result;
    beforeEach(function () {
      result = mockList();
    });

    it('should return a successful response', function () {
      expect(result).toEqual({
        statusCode: config.get('status').SUCCESS,
        data: ['entries'],
        headers: config.get('standardHeaders')
      });
    });
  });
});
