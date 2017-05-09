import { describe, beforeEach, it, expect } from '../../jasmine.js';

describe('mock list', () => {
  let mockList, mockEntries;
  beforeEach(() => {
    mockEntries = ['entries'];
    mockList = require('../../../lib/mock-list.js').default;
  });

  describe('GET request', () => {
    let result;
    beforeEach(() => {
      result = mockList(mockEntries);
    });

    it('should return a successful response', () => {
      expect(result).toEqual({
        statusCode: 200,
        data: ['entries'],
        headers: { 'Content-Type': 'application/json' }
      });
    });
  });
});
