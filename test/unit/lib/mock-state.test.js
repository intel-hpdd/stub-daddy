import { describe, beforeEach, it, jasmine, expect } from '../../jasmine.js';

describe('test mock status module', () => {
  let mockStatus, mockState, entries;

  beforeEach(() => {
    mockStatus = {
      getMockApiState: jasmine.createSpy('getMockApiState')
    };

    mockState = require('../../../lib/mock-state').default;
  });

  describe('without errors', () => {
    beforeEach(() => {
      mockStatus.getMockApiState.and.returnValue([]);
    });

    it('should call getMockApiState with the request store', () => {
      mockState(entries, mockStatus);
      expect(mockStatus.getMockApiState).toHaveBeenCalledOnceWith(entries);
    });

    it('should have a response indicating good standing', () => {
      const response = mockState(entries, mockStatus);
      expect(response).toEqual({
        statusCode: 200,
        data: [],
        headers: { 'Content-Type': 'application/json' }
      });
    });
  });

  describe('with errors', () => {
    beforeEach(() => {
      mockStatus.getMockApiState.and.returnValue([
        {
          state: 'ERROR',
          message: 'Call to expected mock not satisfied.',
          data: {
            request: {},
            response: {},
            expires: 2,
            dependencies: [],
            timeout: 0,
            remainingCalls: 1,
            calls: 1
          }
        }
      ]);
    });

    it('should throw an error', () => {
      expect(() => {
        mockState(entries, mockStatus);
      }).toThrow(jasmine.any(Error));
    });
  });
});
