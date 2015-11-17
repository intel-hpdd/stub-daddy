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

    mockStatus.getMockApiState.and.returnValue({});
  });

  it('should call getMockApiState with the request store', function () {
    mockState();
    expect(mockStatus.getMockApiState).toHaveBeenCalledOnceWith();
  });

  it('should have a response indicating good standing', function() {
    var response = mockState();
    expect(response).toEqual({
      statusCode: 200,
      data: {},
      headers: config.get('standardHeaders')
    });
  });
});
