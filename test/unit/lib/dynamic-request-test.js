const proxyquire = require('proxyquire').noPreserveCache().noCallThru();
const entry = require('../../../lib/entry');
const fp = require('@mfl/fp');
const url = require('url');
const querystring = require('querystring');

const bodies = [{ name: 'will' }, undefined];
bodies.forEach(function(body) {
  describe('test dynamic-request module', function() {
    let dynamicRequest,
      mockStatus,
      entry,
      mockRequest,
      searchRequest,
      searchResponse,
      logger,
      config,
      entries,
      entry1,
      entry2,
      spy;
    beforeEach(function() {
      config = require('../../../config');
      mockStatus = jasmine.createSpyObj('mockStatus', [
        'recordRequest',
        'recordNonMatchingRequest'
      ]);
      logger = jasmine.createSpyObj('logger', [
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
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko)"' +
            ' Chrome/35.0.1916.153 Safari/537.36',
          'content-type': 'text/plain; charset=utf-8',
          accept: '*/*',
          'accept-encoding': 'gzip,deflate,sdch',
          'accept-language': 'en-US,en;q=0.8',
          cookie: 'm=34e2:; csrftoken=Di8V2cFIUliMJVr0tNb8E4SrwCp5QMdg; sessionid=d2fa382c8a220126c1315c94af4bb42c'
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

      entries = [entry1, entry2];

      entry = {
        findEntriesByRequest: jasmine.createSpy('findEntriesByRequest'),
        updateCallCount: jasmine
          .createSpy('updateCallCount')
          .and.callFake(function(x) {
            x.calls += 1;
          }),
        updateEntry: jasmine
          .createSpy('updateEntry')
          .and.callFake(function(entry, entries) {
            const idx = entries.indexOf(entry);
            entries.splice(idx, 1);
          }),
        parsedQueryData: jasmine
          .createSpy('parsedQueryData')
          .and.callFake(function(requestUrl) {
            const getUrl = url.parse(requestUrl);
            return querystring.parse(getUrl.query);
          }),
        canMakeRequest: jasmine.createSpy('canMakeRequest')
      };

      spy = jasmine.createSpy('spy');

      dynamicRequest = proxyquire('../../../lib/dynamic-request', {
        './mock-status': mockStatus,
        '../logger': logger,
        './entries': entries,
        './entry': entry
      });
    });

    describe('handling request on first entry', function() {
      let result;
      beforeEach(function() {
        entry.findEntriesByRequest.and.returnValue([entry1, entry2]);

        result = dynamicRequest(mockRequest, body);
      });

      it('should call findEntriesByRequest with searchRequest', function() {
        expect(entry.findEntriesByRequest).toHaveBeenCalledOnceWith(
          mockStatus,
          searchRequest,
          entries
        );
      });

      it('should call recordRequest with searchRequest', function() {
        expect(mockStatus.recordRequest).toHaveBeenCalledOnceWith(
          searchRequest
        );
      });

      it('should have the expected response', function() {
        expect(result.response).toEqual(entry1.response);
      });

      it('should have 1 call count on the first entry', function() {
        expect(entry1.calls).toEqual(1);
      });

      it('should have no call count on the second entry', function() {
        expect(entry2.calls).toEqual(0);
      });

      it('should call entry.updateEntry for the first entry', function() {
        expect(entry.updateEntry).toHaveBeenCalledOnceWith(entry1, entries);
      });

      it('should not call entry.updateEntry for the second entry', function() {
        expect(entry.updateEntry).not.toHaveBeenCalledOnceWith(entry2, entries);
      });

      describe('handle request on second entry', function() {
        beforeEach(function() {
          entry.findEntriesByRequest.and.returnValue([entry2]);
          entry.canMakeRequest.and.returnValue(false);

          result = dynamicRequest(mockRequest, body);
        });

        it('should have the expected response', function() {
          expect(result.response).toEqual(entry2.response);
        });

        it('should have a call count of 1 on the first entry', function() {
          expect(entry1.calls).toEqual(1);
        });

        it('should have a call count of 1 on the second entry', function() {
          expect(entry2.calls).toEqual(1);
        });

        it('should not have any remaining calls on the second entry', function() {
          expect(entry.canMakeRequest(entry2)).toEqual(false);
        });
      });

      describe('handle request with no available entries', function() {
        it('should have an undefined response', function() {
          entry.findEntriesByRequest.and.returnValue(null);
          expect(dynamicRequest(mockRequest, body)).toEqual(undefined);
        });
      });
    });
  });
});
