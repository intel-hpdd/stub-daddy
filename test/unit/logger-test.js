const proxyquire = require('proxyquire').noPreserveCache().noCallThru();

describe('test logger', function() {
  let logger, newLogger, createLoggerParameter, bunyan;

  beforeEach(function() {
    newLogger = { key: 'logger' };

    bunyan = {
      createLogger: jasmine
        .createSpy('createLogger')
        .and.returnValue(newLogger),
      stdSerializers: {
        err: jasmine.createSpy('err')
      },
      nameFromLevel: {
        10: 'TRACE',
        20: 'DEBUG',
        30: 'INFO',
        40: 'WARN',
        50: 'ERROR',
        60: 'FATAL'
      }
    };

    createLoggerParameter = {
      name: 'stubdaddy',
      serializers: {
        err: bunyan.stdSerializers.err
      },
      streams: [
        {
          type: 'file',
          level: 'debug',
          path: 'stubdaddy.log'
        }
      ]
    };

    logger = proxyquire('../../logger', {
      bunyan: bunyan
    });
  });

  it('should call logger with appropriate params', function() {
    expect(bunyan.createLogger).toHaveBeenCalledWith(createLoggerParameter);
  });

  it('should return the logger instance', function() {
    expect(logger).toEqual({ logByLevel: jasmine.any(Function) });
  });
});
