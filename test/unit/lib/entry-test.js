const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const fixtures = require('../../fixtures/standard-fixtures');
const fp = require('@mfl/fp');
const obj = require('@mfl/obj');
const dataStore = require('../data-store');
const url = require('url');

describe('entry', function() {
  let entry, logger, mockStatus, requestMatcher;

  beforeEach(function() {
    logger = {
      logByLevel: jasmine.createSpy('logByLevel'),
      warn: jasmine.createSpy('warn'),
      info: jasmine.createSpy('info')
    };

    mockStatus = {
      haveRequestsBeenSatisfied: jasmine.createSpy('haveRequestsBeenSatisfied')
    };

    requestMatcher = jasmine.createSpy('requestMatcher');

    entry = proxyquire('../../../lib/entry', {
      '../logger': logger,
      './mock-status': mockStatus,
      '../matcher': requestMatcher
    });
  });

  describe('request entry', function() {
    let request, response, dependencies, requestEntry, entries;
    beforeEach(function() {
      request = {
        method: 'GET',
        url: '/api/dest',
        data: {},
        qs: {},
        headers: {}
      };
      response = {
        statusCode: 200,
        data: { name: 'response' },
        headers: {}
      };
      dependencies = [{ name: 'dependency' }];
      entries = [];

      requestEntry = {
        request: request,
        response: response,
        expires: 1,
        dependencies: dependencies,
        timeout: 0,
        remainingCalls: 1,
        calls: 0
      };
    });

    describe('with a positive expiration', function() {
      it('should be able to make a request', function() {
        expect(entry.canMakeRequest(requestEntry)).toEqual(true);
      });

      it('should not be the expected call count', function() {
        expect(entry.isExpectedCallCount(requestEntry)).toEqual(false);
      });

      describe('after a call is made', function() {
        beforeEach(function() {
          entry.updateCallCount(requestEntry);
        });

        it('should have been called one time', function() {
          expect(requestEntry.calls).toEqual(1);
        });

        it('should have no remaining calls left', function() {
          expect(requestEntry.remainingCalls).toEqual(0);
        });

        it('should be the expected call count', function() {
          expect(entry.isExpectedCallCount(requestEntry)).toEqual(true);
        });

        it('should not be able to make a request', function() {
          expect(entry.canMakeRequest(requestEntry)).toEqual(false);
        });

        describe('calling after the mock has expired', function() {
          beforeEach(function() {
            entry.updateCallCount(requestEntry);
          });

          it('should have been called two times', function() {
            expect(requestEntry.calls).toEqual(2);
          });

          it('should have no remaining calls left', function() {
            expect(requestEntry.remainingCalls).toEqual(-1);
          });

          it('should not be the expected call count', function() {
            expect(entry.isExpectedCallCount(requestEntry)).toEqual(false);
          });

          it('should not be able to make a request', function() {
            expect(entry.canMakeRequest(requestEntry)).toEqual(false);
          });
        });
      });
    });

    describe('with an expiration of 0', function() {
      beforeEach(function() {
        requestEntry = {
          request: request,
          response: response,
          expires: 0,
          dependencies: dependencies,
          timeout: 0,
          remainingCalls: 1,
          calls: 0
        };
      });

      it('should have 1 remaining call', function() {
        expect(requestEntry.remainingCalls).toEqual(1);
      });

      it('should be able to make a request', function() {
        expect(entry.canMakeRequest(requestEntry)).toEqual(true);
      });

      it('should not be the expected call count', function() {
        expect(entry.isExpectedCallCount(requestEntry)).toEqual(false);
      });

      describe('after a call is made', function() {
        beforeEach(function() {
          entry.updateCallCount(requestEntry);
        });

        it('should be able to make a request', function() {
          expect(entry.canMakeRequest(requestEntry)).toEqual(true);
        });

        it('should meet the expected call count criteria', function() {
          expect(entry.isExpectedCallCount(requestEntry)).toEqual(true);
        });
      });
    });

    describe('with an expiration of -1', function() {
      beforeEach(function() {
        requestEntry = {
          request: request,
          response: response,
          expires: -1,
          dependencies: dependencies,
          timeout: 0,
          remainingCalls: 1,
          calls: 0
        };
      });

      it('should have 1 remaining call', function() {
        expect(requestEntry.remainingCalls).toEqual(1);
      });

      it('should be able to make a request', function() {
        expect(entry.canMakeRequest(requestEntry)).toEqual(true);
      });

      it('should be the expected call count', function() {
        expect(entry.isExpectedCallCount(requestEntry)).toEqual(true);
      });

      describe('after a call is made', function() {
        beforeEach(function() {
          entry.updateCallCount(requestEntry);
        });

        it('should be able to make a request', function() {
          expect(entry.canMakeRequest(requestEntry)).toEqual(true);
        });

        it('should meet the expected call count criteria', function() {
          expect(entry.isExpectedCallCount(requestEntry)).toEqual(true);
        });
      });
    });

    describe('adding an entry', function() {
      beforeEach(function() {
        entry.addEntry(
          requestEntry.request,
          requestEntry.response,
          requestEntry.expires,
          requestEntry.dependencies,
          requestEntry.timeout,
          entries
        );
      });

      it('should call logByLevel', function() {
        expect(logger.logByLevel).toHaveBeenCalledOnceWith({
          DEBUG: [
            { url: requestEntry.request.url },
            'adding entry to request store.'
          ],
          TRACE: [
            {
              request: requestEntry.request,
              response: requestEntry.response,
              expires: requestEntry.expires,
              dependencies: requestEntry.dependencies
            },
            'adding entry to request store: '
          ]
        });
      });

      it('should have pushed the entry into entries', function() {
        expect(entries).toEqual([requestEntry]);
      });
    });

    describe('find entries', function() {
      let selectedEntries;
      describe('with filtered entries', function() {
        beforeEach(function() {
          requestMatcher.and.returnValue(true);
          mockStatus.haveRequestsBeenSatisfied.and.returnValue(true);
          entries = [requestEntry];
          selectedEntries = entry.findEntriesByRequest(
            mockStatus,
            requestEntry.request,
            entries
          );
        });

        it('should call requestMatcher', function() {
          expect(requestMatcher).toHaveBeenCalledOnceWith(
            requestEntry.request,
            entries[0].request
          );
        });

        it('should call mockStatus.haveRequestsBeenSatisfied', function() {
          expect(mockStatus.haveRequestsBeenSatisfied).toHaveBeenCalledOnceWith(
            requestEntry.dependencies
          );
        });

        it('should call logger.logByLevel', function() {
          expect(logger.logByLevel).toHaveBeenCalledOnceWith({
            DEBUG: ['found entry by request', requestEntry.request.url],
            TRACE: [
              {
                request: requestEntry.request,
                entries: selectedEntries
              },
              'found entry by request'
            ]
          });
        });

        it('should find the entry', function() {
          expect(selectedEntries).toEqual([requestEntry]);
        });
      });

      describe('without filtered entries', function() {
        let request;
        beforeEach(function() {
          requestMatcher.and.returnValue(false);
          request = {
            method: 'POST',
            url: '/api/mock',
            data: { foo: 'bar' },
            qs: {},
            headers: {}
          };
          selectedEntries = entry.findEntriesByRequest(
            mockStatus,
            request,
            entries
          );
        });

        it('should call logger.warn', function() {
          expect(logger.warn).toHaveBeenCalledOnceWith(
            { request: request },
            'entry for request not found'
          );
        });

        it('should not call requestMatcher', function() {
          expect(requestMatcher).not.toHaveBeenCalledOnce();
        });

        it('should not call mockStatus.haveRequestsBeenSatisfied', function() {
          expect(
            mockStatus.haveRequestsBeenSatisfied
          ).not.toHaveBeenCalledOnce();
        });

        it('should return null', function() {
          expect(selectedEntries).toBeNull();
        });
      });
    });

    describe('updating an entry', function() {
      let filesystemEntry, filterFilesystemEntry, entry1, entry2;
      beforeEach(function() {
        requestMatcher.and.callFake(function(req1, req2) {
          return req1.url === req2.url;
        });

        entry1 = {
          request: fixtures.integration.registerRequestWithDependencies.json
            .json.request,
          response: fixtures.integration.registerRequestWithDependencies.json
            .json.response,
          expires: fixtures.integration.registerRequestWithDependencies.json
            .json.expires,
          dependencies: [
            obj.merge(
              {},
              fixtures.integration.registerRequestWithDependencies.json.json
                .dependencies[0],
              { url: '/api/filesystem' }
            )
          ],
          timeout: 0,
          calls: 0,
          remainingCalls: 1
        };

        entry2 = {
          request: {
            method: 'PUT',
            url: '/api/filesystem',
            data: { id: 1 },
            qs: {},
            headers: {
              authorization: 'BEARER token55'
            }
          },
          response: {
            statusCode: 200,
            data: {},
            headers: {
              authorization: 'BEARER token55',
              'content-type': 'application/json'
            }
          },
          expires: 1,
          dependencies: [],
          timeout: 0,
          calls: 0,
          remainingCalls: 1
        };

        entries = [entry1, entry2];

        filterFilesystemEntry = fp.flow(
          fp.filter(
            fp.flow(fp.pathLens(['request', 'url']), fp.eq('/api/filesystem'))
          )
        );
        filesystemEntry = fp.filter(filterFilesystemEntry, entries).pop();

        filesystemEntry.calls = 1;
        filesystemEntry.remainingCalls = 0;
        entry.updateEntry(filesystemEntry, entries);
      });

      it('should remove the dependency from the dependency list', function() {
        expect(entry1.dependencies).toEqual([]);
      });

      it('should no longer is the filesystem entry in the entry list', function() {
        expect(fp.filter(filterFilesystemEntry, entries).length).toEqual(0);
      });
    });

    describe('flushing entries', function() {
      let entries;
      beforeEach(function() {
        entries = [1, 2];
        entry.flushEntries(entries);
      });

      it('should remove all entries from the entries array', function() {
        expect(entries.length).toEqual(0);
      });

      it('should log', function() {
        expect(logger.info).toHaveBeenCalledOnceWith(
          'flushing request store entries'
        );
      });
    });
  });

  describe('parsing query data', function() {
    let parsedUrl, qs;
    beforeEach(function() {
      parsedUrl = url.parse('/api/mock?foo=bar');
      qs = entry.parsedQueryData(parsedUrl);
    });

    it('should have a query string', function() {
      expect(qs).toEqual({ foo: 'bar' });
    });
  });

  describe('single request', function() {
    let request, response, dependencies, entries, requestEntry;
    beforeEach(function() {
      entries = [];
      request = obj.clone(dataStore.searchRequest);
      response = obj.clone(dataStore.searchResponse);
      dependencies = dataStore.searchDependencies;
      requestEntry = dataStore.requestEntry;
      requestMatcher.and.returnValue(true);
      mockStatus.haveRequestsBeenSatisfied.and.returnValue(true);

      entry.addEntry(request, response, 0, dependencies, 0, entries);
    });

    describe('matching', function() {
      let foundEntries, foundEntry;

      beforeEach(function() {
        foundEntries = entry.findEntriesByRequest(mockStatus, request, entries);
        foundEntry = foundEntries.shift();
      });

      it('should have entry.request set', function() {
        expect(foundEntry.request).toEqual(requestEntry.request);
      });

      it('should have entry.expires set', function() {
        expect(foundEntry.expires).toEqual(requestEntry.expires);
      });

      it('should have entry.respone set', function() {
        expect(foundEntry.response).toEqual(requestEntry.response);
      });

      it('should have entry.remainingCalls set', function() {
        expect(foundEntry.remainingCalls).toEqual(requestEntry.remainingCalls);
      });

      it('should have entry.dependencies set', function() {
        expect(requestEntry.dependencies).toEqual(dependencies);
      });

      it('should call requestMatcher with request and entry.request', function() {
        expect(requestMatcher).toHaveBeenCalledOnceWith(
          request,
          foundEntry.request
        );
      });
    });

    describe('multiple requests matching', function() {
      let request2, response2, dependencies2;

      beforeEach(function() {
        request2 = obj.clone(request);
        response2 = obj.clone(response);
        response2.data.name = 'Joe';
        dependencies2 = obj.clone(dependencies);
        dependencies2[0].data.name = 'Joe';

        entry.addEntry(request2, response2, 0, dependencies2, 0, entries);

        requestMatcher.and.returnValue(true);
      });

      describe('all of which have not had their dependencies met', function() {
        beforeEach(function() {
          mockStatus.haveRequestsBeenSatisfied.and.returnValue(false);
          entries = entry.findEntriesByRequest(mockStatus, request, entries);
        });

        it('should return null', function() {
          expect(entries).toEqual(null);
        });
      });

      describe('some of which have their dependencies met', function() {
        let request3, response3, foundEntries;
        beforeEach(function() {
          request3 = obj.clone(request);
          request3.data.name = 'doesnt match';
          response3 = obj.clone(response);
          response3.data.name = 'Wayne';
          entry.addEntry(request3, response3, 0, [], 0, entries);

          mockStatus.haveRequestsBeenSatisfied.and.callFake(function(
            dependencies
          ) {
            // Let the second entry and the entry that doesn't match be satisfied. This will be a good test
            // because we should NOT get back the entry that doesn't match, even though its dependencies have
            // been met.

            return (
              dependencies.length === 0 || dependencies[0].data.name === 'Joe'
            );
          });

          foundEntries = entry.findEntriesByRequest(
            mockStatus,
            request,
            entries
          );
        });

        it('should contain a single entry', function() {
          expect(foundEntries.length).toEqual(1);
        });

        it("should return the entry who's dependencies have been met", function() {
          expect(foundEntries).toEqual([entries[1]]);
        });
      });
    });
  });
});
