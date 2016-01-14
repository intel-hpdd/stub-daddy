'use strict';

var proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('test mock status module', function () {

  var mockStatus, mockState, config;

  beforeEach(function() {
    config = require('../../../config');
    mockStatus = {
      getMockApiState: jasmine.createSpy('getMockApiState')
    };

    mockState = proxyquire('../../../lib/mock-state', {
      './mock-status': mockStatus,
    });
  });

  describe('without errors', function () {
    beforeEach(function () {
      mockStatus.getMockApiState.and.returnValue([]);
    });

    it('should call getMockApiState with the request store', function () {
      mockState();
      expect(mockStatus.getMockApiState).toHaveBeenCalledOnceWith();
    });

    it('should have a response indicating good standing', function() {
      var response = mockState();
      expect(response).toEqual({
        statusCode: 200,
        data: [],
        headers: config.get('standardHeaders')
      });
    });
  });

  describe('with errors', function () {
    beforeEach(function () {
      mockStatus.getMockApiState.and.returnValue([{ state: 'ERROR',
        message: 'Call to expected mock not satisfied.',
        data:
        { request: {},
          response: {},
          expires: 2,
          dependencies: [],
          timeout: 0,
          remainingCalls: 1,
          calls: 1 } }]);
    });

    it('should throw an error', function () {
      expect(function () {
        mockState();
      }).toThrow(jasmine.any(Error));
    });
  });
});
