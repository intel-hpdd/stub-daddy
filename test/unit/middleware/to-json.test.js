import {
  describe,
  beforeEach,
  it,
  jasmine,
  expect,
  jest
} from '../../jasmine.js';

describe('to json middleware', () => {
  let toJson, mockLogger, req, res, data, next;
  beforeEach(() => {
    mockLogger = jasmine.createSpy('logger');
    jest.mock('../logger.js', () => mockLogger);
    toJson = require('../../../middleware/to-json').default;

    req = {};
    res = {};
    data = '{"name":"will"}';
    next = jasmine.createSpy('next');
    toJson(req, res, data, next);
  });

  it('should call next with parsed data', () => {
    expect(next).toHaveBeenCalledOnceWith(req, res, { name: 'will' });
  });
});
