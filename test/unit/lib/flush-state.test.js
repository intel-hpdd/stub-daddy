import {
  describe,
  beforeEach,
  it,
  jasmine,
  expect,
  jest
} from '../../jasmine.js';

describe('flush state', () => {
  let mockEntry, mockStatus, mockEntries, result;

  beforeEach(() => {
    mockEntry = {
      flushEntries: jasmine.createSpy('flushEntries')
    };
    mockEntries = [];

    mockStatus = {
      flushRequests: jasmine.createSpy('flushRequests')
    };

    jest.mock('../lib/entry.js', () => mockEntry);

    result = require('../../../lib/flush-state').default(
      mockEntries,
      mockStatus
    );
  });

  describe('with DELETE request', () => {
    it('should flush the entries in the request store', () => {
      expect(mockEntry.flushEntries).toHaveBeenCalledOnceWith(mockEntries);
    });

    it('should flush the entries in mock status', () => {
      expect(mockStatus.flushRequests).toHaveBeenCalledOnce();
    });

    it('should flush successfully', () => {
      expect(result).toEqual({
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    });
  });
});
