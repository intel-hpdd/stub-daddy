import * as url from 'url';
import querystring from 'querystring';

import {
  describe,
  beforeEach,
  it,
  jasmine,
  expect,
  jest
} from '../../jasmine.js';

const bodies = [{ name: 'will' }, undefined];
bodies.forEach(body => {
  describe('test dynamic-request module', () => {
    let dynamicRequest,
      mockStatus,
      mockEntry,
      mockRequest,
      searchRequest,
      searchResponse,
      mockLogger,
      mockEntries,
      entry1,
      entry2;
    beforeEach(() => {
      mockStatus = jasmine.createSpyObj('mockStatus', [
        'recordRequest',
        'recordNonMatchingRequest'
      ]);
      mockLogger = jasmine.createSpyObj('logger', [
        'info',
        'debug',
        'warn',
        'fatal',
        'trace'
      ]);

      mockRequest = {
        method: 'GET',
        url: '/target?key=value',
        parsedUrl: url.parse('/target?key=value'),
        headers: {
          host: 'localhost:8888',
          connection: 'keep-alive',
          'user-agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko)"' +
            ' Chrome/35.0.1916.153 Safari/537.36',
          'content-type': 'text/plain; charset=utf-8',
          accept: '*/*',
          'accept-encoding': 'gzip,deflate,sdch',
          'accept-language': 'en-US,en;q=0.8',
          cookie:
            'm=34e2:; csrftoken=Di8V2cFIUliMJVr0tNb8E4SrwCp5QMdg; sessionid=d2fa382c8a220126c1315c94af4bb42c'
        }
      };

      searchRequest = {
        method: 'GET',
        url: mockRequest.url,
        data: body || {},
        qs: { key: 'value' },
        headers: mockRequest.headers
      };

      searchResponse = {
        method: 'GET',
        data: body || {},
        headers: mockRequest.headers
      };

      entry1 = {
        request: searchRequest,
        response: searchResponse,
        expires: 1,
        dependencies: [],
        timeout: 0,
        remainingCalls: 1,
        calls: 0
      };

      entry2 = {
        request: searchRequest,
        response: searchResponse,
        expires: 1,
        dependencies: [],
        timeout: 0,
        remainingCalls: 1,
        calls: 0
      };

      mockEntries = [entry1, entry2];

      mockEntry = {
        findEntriesByRequest: jasmine.createSpy('findEntriesByRequest'),
        updateCallCount: jasmine
          .createSpy('updateCallCount')
          .and.callFake(x => {
            x.calls += 1;
          }),
        updateEntry: jasmine
          .createSpy('updateEntry')
          .and.callFake((entry, entries) => {
            const idx = entries.indexOf(entry);
            entries.splice(idx, 1);
          }),
        parsedQueryData: jasmine
          .createSpy('parsedQueryData')
          .and.callFake(requestUrl => {
            const getUrl = url.parse(requestUrl);
            return querystring.parse(getUrl.query);
          }),
        canMakeRequest: jasmine.createSpy('canMakeRequest')
      };
      jest.mock('../logger.js', () => mockLogger);
      jest.mock('../lib/entry.js', () => mockEntry);

      dynamicRequest = require('../../../lib/dynamic-request').default;
    });

    describe('handling request on first entry', () => {
      let result;
      beforeEach(() => {
        mockEntry.findEntriesByRequest.and.returnValue([entry1, entry2]);

        result = dynamicRequest(mockRequest, body, mockEntries, mockStatus);
      });

      it('should call findEntriesByRequest with searchRequest', () => {
        expect(mockEntry.findEntriesByRequest).toHaveBeenCalledOnceWith(
          mockStatus,
          searchRequest,
          mockEntries
        );
      });

      it('should call recordRequest with searchRequest', () => {
        expect(mockStatus.recordRequest).toHaveBeenCalledOnceWith(
          searchRequest
        );
      });

      it('should have the expected response', () => {
        expect(result.response).toEqual(entry1.response);
      });

      it('should have 1 call count on the first entry', () => {
        expect(entry1.calls).toEqual(1);
      });

      it('should have no call count on the second entry', () => {
        expect(entry2.calls).toEqual(0);
      });

      it('should call entry.updateEntry for the first entry', () => {
        expect(mockEntry.updateEntry).toHaveBeenCalledOnceWith(
          entry1,
          mockEntries
        );
      });

      it('should not call entry.updateEntry for the second entry', () => {
        expect(mockEntry.updateEntry).not.toHaveBeenCalledOnceWith(
          entry2,
          mockEntries
        );
      });

      describe('handle request on second entry', () => {
        beforeEach(() => {
          mockEntry.findEntriesByRequest.and.returnValue([entry2]);
          mockEntry.canMakeRequest.and.returnValue(false);

          result = dynamicRequest(mockRequest, body, mockEntries, mockStatus);
        });

        it('should have the expected response', () => {
          expect(result.response).toEqual(entry2.response);
        });

        it('should have a call count of 1 on the first entry', () => {
          expect(entry1.calls).toEqual(1);
        });

        it('should have a call count of 1 on the second entry', () => {
          expect(entry2.calls).toEqual(1);
        });

        it('should not have any remaining calls on the second entry', () => {
          expect(mockEntry.canMakeRequest(entry2)).toEqual(false);
        });
      });

      describe('handle request with no available entries', () => {
        it('should have an undefined response', () => {
          mockEntry.findEntriesByRequest.and.returnValue(null);
          expect(
            dynamicRequest(mockRequest, body, mockEntries, mockStatus)
          ).toEqual(undefined);
        });
      });
    });
  });
});
