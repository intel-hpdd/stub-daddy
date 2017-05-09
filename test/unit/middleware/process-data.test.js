import {
  describe,
  beforeEach,
  it,
  jasmine,
  expect,
  jest
} from '../../jasmine.js';

describe('process data middleware', () => {
  let mockLogger, req, res, next, processData;
  beforeEach(() => {
    mockLogger = {
      logByLevel: jasmine.createSpy('logger.logByLevel')
    };

    jest.mock('../logger.js', () => mockLogger);
    processData = require('../../../middleware/process-data').default;

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

  describe('using inline service', () => {
    beforeEach(() => {
      req.clientReq.data = 'some data';
      delete req.clientReq.on;

      processData(req, res, next);
    });

    it('should call next', () => {
      expect(next).toHaveBeenCalledOnceWith(req, res, req.clientReq.data);
    });
  });

  describe('using web service', () => {
    beforeEach(() => {
      processData(req, res, next);
    });

    it('should define a data event listener', () => {
      expect(req.clientReq.on).toHaveBeenCalledOnceWith(
        'data',
        jasmine.any(Function)
      );
    });

    it('should define an end event listener', () => {
      expect(req.clientReq.on).toHaveBeenCalledOnceWith(
        'end',
        jasmine.any(Function)
      );
    });

    describe('data event', () => {
      let onDataCallback, data;
      beforeEach(() => {
        onDataCallback = req.clientReq.on.calls.argsFor(0)[1];
        data = 'some text';
        onDataCallback(data);
      });

      describe('end event', () => {
        let onEndCallback;
        beforeEach(() => {
          onEndCallback = req.clientReq.on.calls.argsFor(1)[1];
          onEndCallback();
        });

        it('should log the data received', () => {
          expect(mockLogger.logByLevel).toHaveBeenCalledOnceWith({
            DEBUG: ['/api/method', 'Request received:'],
            TRACE: [
              {
                pathname: '/api/method',
                body: data
              },
              'Request received'
            ]
          });
        });

        it('should call next', () => {
          expect(next).toHaveBeenCalledOnceWith(req, res, data);
        });
      });
    });
  });
});
