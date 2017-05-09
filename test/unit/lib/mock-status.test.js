import {
  describe,
  beforeEach,
  it,
  jasmine,
  expect,
  jest
} from '../../jasmine.js';

describe('test mock status', () => {
  let request,
    mockRequestMatcher,
    requestMatcherInner,
    mockStatus,
    mockLogger,
    mockEntries,
    mockEntry;

  beforeEach(() => {
    request = {
      method: 'GET',
      url: '/system/status',
      data: {},
      qs: {},
      headers: {}
    };

    mockEntries = [];
    requestMatcherInner = jasmine
      .createSpy('requestMatcherInner')
      .and.returnValue(true);
    mockRequestMatcher = jasmine
      .createSpy('requestMatcher')
      .and.returnValue(requestMatcherInner);
    mockLogger = jasmine.createSpyObj('logger', [
      'info',
      'debug',
      'warn',
      'fatal',
      'trace'
    ]);

    mockEntry = {
      isExpectedCallCount: jasmine.createSpy('isExpectedCallCount')
    };

    jest.mock('../matcher.js', () => mockRequestMatcher);
    jest.mock('../logger.js', () => mockLogger);
    jest.mock('../lib/entry.js', () => mockEntry);

    mockStatus = require('../../../lib/mock-status').default();
  });

  describe('test recording requests', () => {
    beforeEach(() => {
      request = {
        method: 'GET',
        url: '/system/status',
        data: {},
        qs: {},
        headers: {}
      };

      mockStatus.flushRequests();
      mockStatus.recordRequest(request);
    });

    it('should record the request', () => {
      expect(mockStatus.requests.length).toEqual(1);
    });

    it('should invoke requestMatcher with the request', () => {
      expect(mockRequestMatcher).toHaveBeenCalledOnceWith(request);
    });

    it('should only have one entry of a request even if the request is sent multiple times', () => {
      mockStatus.recordRequest(request);
      expect(mockStatus.requests.length).toEqual(1);
    });
  });

  describe('test the mock api state', () => {
    let errors, unregisteredCalls, unsatisfiedEntries;
    beforeEach(() => {
      unregisteredCalls = [{ id: 1 }];
      unsatisfiedEntries = [{ id: 2 }];
    });

    it('should not contain any errors if getEntries returns an empty array', () => {
      errors = mockStatus.getMockApiState(mockEntries);
      expect(errors).toEqual([]);
    });

    describe('with an entry', () => {
      beforeEach(() => {
        mockEntry.isExpectedCallCount.and.returnValue(false);
        [].push.apply(mockEntries, unsatisfiedEntries);
        errors = mockStatus.getMockApiState(mockEntries);
      });

      it('should invoke entry.isExpectedCallCount', () => {
        expect(mockEntry.isExpectedCallCount).toHaveBeenCalledOnce();
      });

      it('should indicate when a call is not satisfied', () => {
        expect(errors).toEqual([
          {
            state: 'ERROR',
            message: 'Call to expected mock not satisfied.',
            data: {
              id: 2
            }
          }
        ]);
      });
    });

    it('should indicate when a call was made to a non-existent mock', () => {
      mockStatus.recordNonMatchingRequest(unregisteredCalls[0]);
      errors = mockStatus.getMockApiState(mockEntries);

      expect(errors).toEqual([
        {
          state: 'ERROR',
          message: 'Call made to non-existent mock',
          data: {
            id: 1
          }
        }
      ]);
    });

    it('should indicate when a call was made to a non-existent mock and another call is not satisfied', () => {
      [].push.apply(mockEntries, unsatisfiedEntries);
      mockStatus.recordNonMatchingRequest(unregisteredCalls[0]);
      errors = mockStatus.getMockApiState(mockEntries);

      expect(errors).toEqual([
        {
          state: 'ERROR',
          message: 'Call made to non-existent mock',
          data: {
            id: 1
          }
        },
        {
          state: 'ERROR',
          message: 'Call to expected mock not satisfied.',
          data: {
            id: 2
          }
        }
      ]);
    });
  });
});

describe('to verify requests status', () => {
  let requests,
    request1,
    response1,
    entry1,
    request2,
    response2,
    entry2,
    mockEntries,
    mockRequestMatcher,
    mockLogger,
    mockEntry,
    mockStatus;
  beforeEach(() => {
    request1 = {
      method: 'PUT',
      url: '/api/filesystem/',
      data: {},
      qs: {},
      headers: {}
    };
    response1 = {
      statusCode: 200,
      headers: {},
      data: { key: 'value' }
    };
    entry1 = {
      request: request1,
      response: response1,
      expires: 1,
      dependencies: [],
      timeout: 0,
      remainingCalls: 1,
      calls: 0
    };

    request2 = {
      method: 'GET',
      url: '/api/alert/',
      data: {},
      qs: {},
      headers: {}
    };
    response2 = {
      statusCode: 200,
      headers: {},
      data: { key2: 'value2' }
    };
    entry2 = {
      request: request2,
      response: response2,
      expires: 0,
      dependencies: [],
      timeout: 0,
      remainingCalls: 1,
      calls: 0
    };

    mockEntries = [entry1, entry2];

    requests = [request1, request2];

    mockEntry = {
      isExpectedCallCount: jasmine
        .createSpy('isExpectedCallCount')
        .and.callFake(entry => entry.remainingCalls === 0),
      updateCallCount: jasmine
        .createSpy('updateCallCount')
        .and.callFake(function(entry) {
          entry.calls += 1;
          entry.remainingCalls -= 1;
        })
    };

    jest.mock('../matcher.js', () => mockRequestMatcher);
    jest.mock('../logger.js', () => mockLogger);
    jest.mock('../lib/entry.js', () => mockEntry);

    mockStatus = require('../../../lib/mock-status').default();
  });

  it('should be satisfied if an empty array is passed as the requests', () => {
    const result = mockStatus.haveRequestsBeenSatisfied(mockEntries, []);
    expect(result).toBeTruthy();
  });

  it('should be satisfied when all calls are made to each entry', () => {
    mockEntry.updateCallCount(entry1);
    mockEntry.updateCallCount(entry2);
    const result = mockStatus.haveRequestsBeenSatisfied(mockEntries, requests);
    expect(result).toBeTruthy();
  });

  it('should NOT be satisfied if not all required calls are made to each entry', () => {
    const result = mockStatus.haveRequestsBeenSatisfied(mockEntries, requests);
    expect(result).toBeFalsy();
  });

  it("should NOT be satisfied if the filtered entries length doesn't match requests length", () => {
    mockEntry.updateCallCount(entry1);
    // add an additional request that must be present. Only two of the three will match and thus this
    // should fail.
    requests.push({
      method: 'GET',
      url: '/api/notRegistered/',
      data: {},
      qs: {},
      headers: {}
    });
    const result = mockStatus.haveRequestsBeenSatisfied(mockEntries, requests);
    expect(result).toBeFalsy();
  });

  describe('with dependencies', () => {
    describe('specified as a request only', () => {
      it('should not match a call when dependencies have not been satisfied', () => {
        entry2.dependencies = [request1];
        mockEntry.updateCallCount(entry2);
        const result = mockStatus.haveRequestsBeenSatisfied(
          mockEntries,
          entry2.dependencies
        );
        expect(result).toBe(false);
      });

      it('should match a call when dependencies have been satisfied', () => {
        entry2.dependencies = [request1];
        mockEntry.updateCallCount(entry1);
        mockEntry.updateCallCount(entry2);

        const result = mockStatus.haveRequestsBeenSatisfied(
          mockEntries,
          entry2.dependencies
        );
        expect(result).toBe(true);
      });
    });

    describe('specified with request and response', () => {
      it('should not match a call when dependencies have not been satisfied', () => {
        entry2.dependencies = [
          {
            request: request1,
            response: response1
          }
        ];
        mockEntry.updateCallCount(entry2);
        const result = mockStatus.haveRequestsBeenSatisfied(
          mockEntries,
          entry2.dependencies
        );
        expect(result).toBe(false);
      });

      it('should not match a call when the request matches but the response does not', () => {
        entry2.dependencies = [
          {
            request: request1,
            response: response2
          }
        ];
        mockEntry.updateCallCount(entry1);
        mockEntry.updateCallCount(entry2);
        const result = mockStatus.haveRequestsBeenSatisfied(
          mockEntries,
          entry2.dependencies
        );
        expect(result).toBe(false);
      });

      it('should match a call when dependencies have been satisfied', () => {
        entry2.dependencies = [
          {
            request: request1,
            response: response1
          }
        ];
        mockEntry.updateCallCount(entry1);
        mockEntry.updateCallCount(entry2);

        const result = mockStatus.haveRequestsBeenSatisfied(
          mockEntries,
          entry2.dependencies
        );
        expect(result).toBe(true);
      });
    });
  });
});
