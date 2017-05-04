var proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('flush state', function () {
  var flushState, entry, mockStatus, config, entries;

  beforeEach(function () {
    config = require('../../../config');
    entry = {
      flushEntries: jasmine.createSpy('flushEntries')
    };
    entries = [];

    mockStatus = {
      flushRequests: jasmine.createSpy('flushRequests')
    };

    flushState = proxyquire('../../../lib/flush-state', {
      './mock-status': mockStatus,
      './entry': entry,
      './entries': entries
    });
  });

  describe('with DELETE request', function () {
    var result;
    beforeEach(function () {
      result = flushState();
    });

    it('should flush the entries in the request store', function () {
      expect(entry.flushEntries).toHaveBeenCalledOnceWith(entries);
    });

    it('should flush the entries in mock status', function () {
      expect(mockStatus.flushRequests).toHaveBeenCalledOnce();
    });

    it('should flush successfully', function () {
      expect(result).toEqual({
        statusCode: config.get('status').SUCCESS,
        headers: config.get('standardHeaders')
      });
    });
  });
});
