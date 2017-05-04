const proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('test mock status', function() {
  let request,
    requestMatcher,
    requestMatcherInner,
    mockStatus,
    logger,
    entries,
    entry;

  beforeEach(function() {
    request = {
      method: 'GET',
      url: '/system/status',
      data: {},
      qs: {},
      headers: {}
    };

    entries = [];
    requestMatcherInner = jasmine
      .createSpy('requestMatcherInner')
      .and.returnValue(true);
    requestMatcher = jasmine
      .createSpy('requestMatcher')
      .and.returnValue(requestMatcherInner);
    logger = jasmine.createSpyObj('logger', [
      'info',
      'debug',
      'warn',
      'fatal',
      'trace'
    ]);

    entry = {
      isExpectedCallCount: jasmine.createSpy('isExpectedCallCount')
    };

    mockStatus = proxyquire('../../../lib/mock-status', {
      '../matcher': requestMatcher,
      '../logger': logger,
      './entries': entries,
      './entry': entry
    });
  });

  describe('test recording requests', function() {
    beforeEach(function() {
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

    it('should record the request', function() {
      expect(mockStatus.requests.length).toEqual(1);
    });

    it('should invoke requestMatcher with the request', function() {
      expect(requestMatcher).toHaveBeenCalledOnceWith(request);
    });

    it('should only have one entry of a request even if the request is sent multiple times', function() {
      mockStatus.recordRequest(request);
      expect(mockStatus.requests.length).toEqual(1);
    });
  });

  describe('test the mock api state', function() {
    let errors, unregisteredCalls, unsatisfiedEntries;
    beforeEach(function() {
      unregisteredCalls = [{ id: 1 }];
      unsatisfiedEntries = [{ id: 2 }];
    });

    it('should not contain any errors if getEntris returns an empty array', function() {
      errors = mockStatus.getMockApiState();
      expect(errors).toEqual([]);
    });

    describe('with an entry', function() {
      beforeEach(function() {
        entry.isExpectedCallCount.and.returnValue(false);
        [].push.apply(entries, unsatisfiedEntries);
        errors = mockStatus.getMockApiState();
      });

      it('should invoke entry.isExpectedCallCount', function() {
        expect(entry.isExpectedCallCount).toHaveBeenCalledOnce();
      });

      it('should indicate when a call is not satisfied', function() {
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

    it('should indicate when a call was made to a non-existent mock', function() {
      mockStatus.recordNonMatchingRequest(unregisteredCalls[0]);
      errors = mockStatus.getMockApiState();

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

    it('should indicate when a call was made to a non-existent mock and another call is not satisfied', function() {
      [].push.apply(entries, unsatisfiedEntries);
      mockStatus.recordNonMatchingRequest(unregisteredCalls[0]);
      errors = mockStatus.getMockApiState();

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

  describe('to verify requests status', function() {
    let entries,
      requests,
      request1,
      response1,
      entry1,
      request2,
      response2,
      entry2;
    beforeEach(function() {
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

      entries = [entry1, entry2];

      requests = [request1, request2];

      entry = {
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

      mockStatus = proxyquire('../../../lib/mock-status', {
        './matcher': requestMatcher,
        './logger': logger,
        './entry': entry,
        './entries': entries
      });
    });

    it('should be satisfied if an empty array is passed as the requests', function() {
      const result = mockStatus.haveRequestsBeenSatisfied([]);
      expect(result).toBeTruthy();
    });

    it('should be satisfied when all calls are made to each entry', function() {
      entry.updateCallCount(entry1);
      entry.updateCallCount(entry2);
      const result = mockStatus.haveRequestsBeenSatisfied(requests);
      expect(result).toBeTruthy();
    });

    it('should NOT be satisfied if not all required calls are made to each entry', function() {
      const result = mockStatus.haveRequestsBeenSatisfied(requests);
      expect(result).toBeFalsy();
    });

    it("should NOT be satisfied if the filtered entries length doesn't match requests length", function() {
      entry.updateCallCount(entry1);
      // add an additional request that must be present. Only two of the three will match and thus this
      // should fail.
      requests.push({
        method: 'GET',
        url: '/api/notRegistered/',
        data: {},
        qs: {},
        headers: {}
      });
      const result = mockStatus.haveRequestsBeenSatisfied(requests);
      expect(result).toBeFalsy();
    });

    describe('with dependencies', function() {
      describe('specified as a request only', function() {
        it('should not match a call when dependencies have not been satisfied', function() {
          entry2.dependencies = [request1];
          entry.updateCallCount(entry2);
          const result = mockStatus.haveRequestsBeenSatisfied(
            entry2.dependencies
          );
          expect(result).toBe(false);
        });

        it('should match a call when dependencies have been satisfied', function() {
          entry2.dependencies = [request1];
          entry.updateCallCount(entry1);
          entry.updateCallCount(entry2);

          const result = mockStatus.haveRequestsBeenSatisfied(
            entry2.dependencies
          );
          expect(result).toBe(true);
        });
      });

      describe('specified with request and response', function() {
        it('should not match a call when dependencies have not been satisfied', function() {
          entry2.dependencies = [
            {
              request: request1,
              response: response1
            }
          ];
          entry.updateCallCount(entry2);
          const result = mockStatus.haveRequestsBeenSatisfied(
            entry2.dependencies
          );
          expect(result).toBe(false);
        });

        it('should not match a call when the request matches but the response does not', function() {
          entry2.dependencies = [
            {
              request: request1,
              response: response2
            }
          ];
          entry.updateCallCount(entry1);
          entry.updateCallCount(entry2);
          const result = mockStatus.haveRequestsBeenSatisfied(
            entry2.dependencies
          );
          expect(result).toBe(false);
        });

        it('should match a call when dependencies have been satisfied', function() {
          entry2.dependencies = [
            {
              request: request1,
              response: response1
            }
          ];
          entry.updateCallCount(entry1);
          entry.updateCallCount(entry2);

          const result = mockStatus.haveRequestsBeenSatisfied(
            entry2.dependencies
          );
          expect(result).toBe(true);
        });
      });
    });
  });
});
