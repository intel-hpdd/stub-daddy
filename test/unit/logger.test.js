import { describe, beforeEach, it, jasmine, expect, jest } from '../jasmine.js';

describe('test logger', () => {
  let logger, newLogger, createLoggerParameter, mockBunyan;

  beforeEach(() => {
    newLogger = { key: 'logger' };

    mockBunyan = {
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
        err: mockBunyan.stdSerializers.err
      },
      streams: [
        {
          type: 'file',
          level: 'debug',
          path: 'stubdaddy.log'
        }
      ]
    };

    jest.mock('bunyan', () => mockBunyan);

    logger = require('../../logger.js').default;
  });

  it('should call logger with appropriate params', function() {
    expect(mockBunyan.createLogger).toHaveBeenCalledWith(createLoggerParameter);
  });

  it('should return the logger instance', function() {
    expect(logger).toEqual({ logByLevel: jasmine.any(Function) });
  });
});
