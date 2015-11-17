'use strict';

var proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('process data middleware', function () {
  var logger, req, res, next, processData;
  beforeEach(function () {
    logger = {
      logByLevel: jasmine.createSpy('logger.logByLevel')
    };

    processData = proxyquire('../../../middleware/process-data', {
      '../logger': logger
    });

    req = {
      clientReq: {
        on: jasmine.createSpy('req.clientReq.on'),
        parsedUrl: {
          pathname: '/api/method'
        }
      }
    };

    res = {};

    next = jasmine.createSpy('next');
  });

  describe('using inline service', function () {
    beforeEach(function () {
      req.clientReq.data = 'some data';
      delete req.clientReq.on;

      processData(req, res, next);
    });

    it('should call next', function () {
      expect(next).toHaveBeenCalledOnceWith(req, res, req.clientReq.data);
    });
  });

  describe('using web service', function () {
    beforeEach(function () {
      processData(req, res, next);
    });

    it('should define a data event listener', function () {
      expect(req.clientReq.on).toHaveBeenCalledOnceWith('data', jasmine.any(Function));
    });

    it('should define an end event listener', function () {
      expect(req.clientReq.on).toHaveBeenCalledOnceWith('end', jasmine.any(Function));
    });

    describe('data event', function () {
      var onDataCallback, data;
      beforeEach(function () {
        onDataCallback = req.clientReq.on.calls.argsFor(0)[1];
        data = 'some text';
        onDataCallback(data);
      });

      describe('end event', function () {
        var onEndCallback;
        beforeEach(function () {
          onEndCallback = req.clientReq.on.calls.argsFor(1)[1];
          onEndCallback();
        });

        it('should log the data received', function () {
          expect(logger.logByLevel).toHaveBeenCalledOnceWith({
            DEBUG: ['/api/method', 'Request received:'],
            TRACE: [{
              pathname: '/api/method',
              body: data
            }, 'Request received']
          });
        });

        it('should call next', function () {
          expect(next).toHaveBeenCalledOnceWith(req, res, data);
        });
      });
    });
  });
});
