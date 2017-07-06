import fixtures from '../../fixtures/standard-fixtures';
import * as fp from '@iml/fp';
import dataStore from '../data-store';
import * as url from 'url';

import {
  describe,
  beforeEach,
  it,
  jasmine,
  expect,
  jest
} from '../../jasmine.js';

describe('entry', () => {
  let entry, mockLogger, mockStatus, mockRequestMatcher, matchByElementRequest;

  beforeEach(() => {
    mockLogger = {
      logByLevel: jasmine.createSpy('logByLevel'),
      warn: jasmine.createSpy('warn'),
      info: jasmine.createSpy('info')
    };

    mockStatus = {
      haveRequestsBeenSatisfied: jasmine.createSpy('haveRequestsBeenSatisfied')
    };

    matchByElementRequest = jasmine.createSpy('matchByElementRequest');

    mockRequestMatcher = jasmine.createSpy('requestMatcher');

    jest.mock('../logger.js', () => mockLogger);
    jest.mock('../lib/mock-status', () => mockStatus);
    jest.mock('../matcher.js', () => mockRequestMatcher);

    entry = require('../../../lib/entry').default;
  });

  describe('request entry', () => {
    let request, response, dependencies, requestEntry, entries;
    beforeEach(() => {
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

    describe('with a positive expiration', () => {
      it('should be able to make a request', () => {
        expect(entry.canMakeRequest(requestEntry)).toEqual(true);
      });

      it('should not be the expected call count', () => {
        expect(entry.isExpectedCallCount(requestEntry)).toEqual(false);
      });

      describe('after a call is made', () => {
        beforeEach(() => {
          entry.updateCallCount(requestEntry);
        });

        it('should have been called one time', () => {
          expect(requestEntry.calls).toEqual(1);
        });

        it('should have no remaining calls left', () => {
          expect(requestEntry.remainingCalls).toEqual(0);
        });

        it('should be the expected call count', () => {
          expect(entry.isExpectedCallCount(requestEntry)).toEqual(true);
        });

        it('should not be able to make a request', () => {
          expect(entry.canMakeRequest(requestEntry)).toEqual(false);
        });

        describe('calling after the mock has expired', () => {
          beforeEach(() => {
            entry.updateCallCount(requestEntry);
          });

          it('should have been called two times', () => {
            expect(requestEntry.calls).toEqual(2);
          });

          it('should have no remaining calls left', () => {
            expect(requestEntry.remainingCalls).toEqual(-1);
          });

          it('should not be the expected call count', () => {
            expect(entry.isExpectedCallCount(requestEntry)).toEqual(false);
          });

          it('should not be able to make a request', () => {
            expect(entry.canMakeRequest(requestEntry)).toEqual(false);
          });
        });
      });
    });

    describe('with an expiration of 0', () => {
      beforeEach(() => {
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

      it('should have 1 remaining call', () => {
        expect(requestEntry.remainingCalls).toEqual(1);
      });

      it('should be able to make a request', () => {
        expect(entry.canMakeRequest(requestEntry)).toEqual(true);
      });

      it('should not be the expected call count', () => {
        expect(entry.isExpectedCallCount(requestEntry)).toEqual(false);
      });

      describe('after a call is made', () => {
        beforeEach(() => {
          entry.updateCallCount(requestEntry);
        });

        it('should be able to make a request', () => {
          expect(entry.canMakeRequest(requestEntry)).toEqual(true);
        });

        it('should meet the expected call count criteria', () => {
          expect(entry.isExpectedCallCount(requestEntry)).toEqual(true);
        });
      });
    });

    describe('with an expiration of -1', () => {
      beforeEach(() => {
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

      it('should have 1 remaining call', () => {
        expect(requestEntry.remainingCalls).toEqual(1);
      });

      it('should be able to make a request', () => {
        expect(entry.canMakeRequest(requestEntry)).toEqual(true);
      });

      it('should be the expected call count', () => {
        expect(entry.isExpectedCallCount(requestEntry)).toEqual(true);
      });

      describe('after a call is made', () => {
        beforeEach(() => {
          entry.updateCallCount(requestEntry);
        });

        it('should be able to make a request', () => {
          expect(entry.canMakeRequest(requestEntry)).toEqual(true);
        });

        it('should meet the expected call count criteria', () => {
          expect(entry.isExpectedCallCount(requestEntry)).toEqual(true);
        });
      });
    });

    describe('adding an entry', () => {
      beforeEach(() => {
        entry.addEntry(
          requestEntry.request,
          requestEntry.response,
          requestEntry.expires,
          requestEntry.dependencies,
          requestEntry.timeout,
          entries
        );
      });

      it('should call logByLevel', () => {
        expect(mockLogger.logByLevel).toHaveBeenCalledOnceWith({
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

      it('should have pushed the entry into entries', () => {
        expect(entries).toEqual([requestEntry]);
      });
    });

    describe('find entries', () => {
      let selectedEntries;
      describe('with filtered entries', () => {
        beforeEach(() => {
          matchByElementRequest.and.returnValue(true);
          mockRequestMatcher.and.returnValue(matchByElementRequest);
          mockStatus.haveRequestsBeenSatisfied.and.returnValue(true);
          entries = [requestEntry];
          selectedEntries = entry.findEntriesByRequest(
            mockStatus,
            requestEntry.request,
            entries
          );
        });

        it('should call requestMatcher', () => {
          expect(mockRequestMatcher).toHaveBeenCalledOnceWith(
            requestEntry.request
          );
        });

        it('should call matchByElementRequest', () => {
          expect(matchByElementRequest).toHaveBeenCalledOnceWith(
            entries[0].request
          );
        });

        it('should call mockStatus.haveRequestsBeenSatisfied', () => {
          expect(mockStatus.haveRequestsBeenSatisfied).toHaveBeenCalledOnceWith(
            entries,
            requestEntry.dependencies
          );
        });

        it('should call logger.logByLevel', () => {
          expect(mockLogger.logByLevel).toHaveBeenCalledOnceWith({
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

        it('should find the entry', () => {
          expect(selectedEntries).toEqual([requestEntry]);
        });
      });

      describe('without filtered entries', () => {
        let request;
        beforeEach(() => {
          mockRequestMatcher.and.returnValue(false);
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

        it('should call logger.warn', () => {
          expect(mockLogger.warn).toHaveBeenCalledOnceWith(
            { request: request },
            'entry for request not found'
          );
        });

        it('should not call mockStatus.haveRequestsBeenSatisfied', () => {
          expect(
            mockStatus.haveRequestsBeenSatisfied
          ).not.toHaveBeenCalledOnce();
        });

        it('should return null', () => {
          expect(selectedEntries).toBeNull();
        });
      });
    });

    describe('updating an entry', () => {
      let filesystemEntry, filterFilesystemEntry, entry1, entry2;
      beforeEach(() => {
        mockRequestMatcher.and.callFake(req1 => req2 => req1.url === req2.url);

        entry1 = {
          request: fixtures.integration.registerRequestWithDependencies.json
            .json.request,
          response: fixtures.integration.registerRequestWithDependencies.json
            .json.response,
          expires: fixtures.integration.registerRequestWithDependencies.json
            .json.expires,
          dependencies: [
            {
              ...fixtures.integration.registerRequestWithDependencies.json.json
                .dependencies[0],
              url: '/api/filesystem'
            }
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
          fp.flow(x => x['request']['url'], fp.eq('/api/filesystem'))
        );
        filesystemEntry = fp.filter(filterFilesystemEntry)(entries).pop();

        filesystemEntry.calls = 1;
        filesystemEntry.remainingCalls = 0;
        entry.updateEntry(filesystemEntry, entries);
      });

      it('should remove the dependency from the dependency list', () => {
        expect(entry1.dependencies).toEqual([]);
      });

      it('should no longer is the filesystem entry in the entry list', () => {
        expect(fp.filter(filterFilesystemEntry)(entries).length).toEqual(0);
      });
    });

    describe('flushing entries', () => {
      let entries;
      beforeEach(() => {
        entries = [1, 2];
        entry.flushEntries(entries);
      });

      it('should remove all entries from the entries array', () => {
        expect(entries.length).toEqual(0);
      });

      it('should log', () => {
        expect(mockLogger.info).toHaveBeenCalledOnceWith(
          'flushing request store entries'
        );
      });
    });
  });

  describe('parsing query data', () => {
    let parsedUrl, qs;
    beforeEach(() => {
      parsedUrl = url.parse('/api/mock?foo=bar');
      qs = entry.parsedQueryData(parsedUrl);
    });

    it('should have a query string', () => {
      expect(qs).toEqual({ foo: 'bar' });
    });
  });

  describe('single request', () => {
    let request, response, dependencies, entries, requestEntry;
    beforeEach(() => {
      entries = [];
      request = {
        ...dataStore.searchRequest,
        data: { ...dataStore.searchRequest.data },
        headers: { ...dataStore.searchRequest.headers }
      };
      response = {
        ...dataStore.searchResponse,
        data: { ...dataStore.searchResponse.data },
        headers: { ...dataStore.searchResponse.headers }
      };
      dependencies = dataStore.searchDependencies;
      requestEntry = dataStore.requestEntry;
      matchByElementRequest.and.returnValue(true);
      mockRequestMatcher.and.returnValue(matchByElementRequest);
      mockStatus.haveRequestsBeenSatisfied.and.returnValue(true);

      entries = entry.addEntry(request, response, 0, dependencies, 0, entries);
    });

    describe('matching', () => {
      let foundEntries, foundEntry;

      beforeEach(() => {
        foundEntries = entry.findEntriesByRequest(mockStatus, request, entries);
        foundEntry = foundEntries.shift();
      });

      it('should have entry.request set', () => {
        expect(foundEntry.request).toEqual(requestEntry.request);
      });

      it('should have entry.expires set', () => {
        expect(foundEntry.expires).toEqual(requestEntry.expires);
      });

      it('should have entry.respone set', () => {
        expect(foundEntry.response).toEqual(requestEntry.response);
      });

      it('should have entry.remainingCalls set', () => {
        expect(foundEntry.remainingCalls).toEqual(requestEntry.remainingCalls);
      });

      it('should have entry.dependencies set', () => {
        expect(requestEntry.dependencies).toEqual(dependencies);
      });

      it('should call requestMatcher with request and entry.request', () => {
        expect(mockRequestMatcher).toHaveBeenCalledOnceWith(request);
      });

      it('should call matchByElementRequest', () => {
        expect(matchByElementRequest).toHaveBeenCalledOnceWith(
          foundEntry.request
        );
      });
    });

    describe('multiple requests matching', () => {
      let request2, response2, dependencies2;

      beforeEach(() => {
        request2 = {
          ...dataStore.searchRequest,
          data: { ...dataStore.searchRequest.data },
          headers: { ...dataStore.searchRequest.headers }
        };
        response2 = {
          ...dataStore.searchResponse,
          data: { ...dataStore.searchResponse.data, name: 'Joe' },
          headers: { ...dataStore.searchResponse.headers }
        };

        dependencies2 = [
          {
            ...dataStore.searchDependencies[0],
            data: { ...dataStore.searchDependencies[0].data, name: 'Joe' },
            headers: { ...dataStore.searchDependencies[0].headers }
          }
        ];

        entries = entry.addEntry(
          request2,
          response2,
          0,
          dependencies2,
          0,
          entries
        );

        matchByElementRequest.and.returnValue(true);
        mockRequestMatcher.and.returnValue(matchByElementRequest);
      });

      describe('all of which have not had their dependencies met', () => {
        beforeEach(() => {
          mockStatus.haveRequestsBeenSatisfied.and.returnValue(false);
          entries = entry.findEntriesByRequest(mockStatus, request, entries);
        });

        it('should return null', () => {
          expect(entries).toEqual(null);
        });
      });

      describe('some of which have their dependencies met', () => {
        let request3, response3, foundEntries;
        beforeEach(() => {
          request3 = {
            ...dataStore.searchRequest,
            data: { ...dataStore.searchRequest.data, name: 'doesnt match' },
            headers: { ...dataStore.searchRequest.headers }
          };
          response3 = {
            ...dataStore.searchResponse,
            data: { ...dataStore.searchResponse.data, name: 'Wayne' },
            headers: { ...dataStore.searchResponse.headers }
          };

          entries = entry.addEntry(request3, response3, 0, [], 0, entries);

          mockStatus.haveRequestsBeenSatisfied.and.callFake(
            (entries, dependencies) =>
              dependencies.length === 0 || dependencies[0].data.name === 'Joe'
          );

          foundEntries = entry.findEntriesByRequest(
            mockStatus,
            request,
            entries
          );
        });

        it('should contain a single entry', () => {
          expect(foundEntries.length).toEqual(1);
        });

        it("should return the entry who's dependencies have been met", () => {
          expect(foundEntries).toEqual([entries[1]]);
        });
      });
    });
  });
});
