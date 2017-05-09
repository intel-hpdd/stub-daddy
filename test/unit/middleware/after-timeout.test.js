import {
  default as afterTimeout,
  clearTimeouts
} from '../../../middleware/after-timeout';

import { describe, beforeEach, it, jasmine, expect } from '../../jasmine.js';

describe('after timeout', () => {
  let req, res, data;
  beforeEach(() => {
    res = {
      clientRes: {}
    };
    data = { foo: 'bar' };
  });

  describe('with a timeout', () => {
    beforeEach(() => {
      req = {
        timeout: 500
      };
    });

    it('should pass the request to next asynchronously', function(done) {
      afterTimeout(req, res, data, function(request) {
        expect(request).toEqual(req);
        done();
      });
    });

    it('should pass the response to next', function(done) {
      afterTimeout(req, res, data, function(request, response) {
        expect(response).toEqual({
          clientRes: {}
        });
        done();
      });
    });

    it('should pass the data to next', function(done) {
      afterTimeout(req, res, data, function(request, response, data) {
        expect(data).toEqual({
          foo: 'bar'
        });
        done();
      });
    });
  });

  describe('without a timeout', () => {
    let next;
    beforeEach(() => {
      req = {};
      next = jasmine.createSpy('next');

      afterTimeout(req, res, data, next);
    });

    it('should call next with the request and response', () => {
      expect(next).toHaveBeenCalledOnceWith(
        {},
        {
          clientRes: {}
        },
        {
          foo: 'bar'
        }
      );
    });
  });

  describe('clear timeouts', () => {
    let req, res, body, next;
    beforeEach(() => {
      req = {
        timeout: 10000
      };

      next = jasmine.createSpy('next');
      res = {};
      body = {};

      afterTimeout(req, res, body, next);
    });

    it('should not have called next', () => {
      expect(next).not.toHaveBeenCalled();
    });

    describe('force clear the timeouts', () => {
      beforeEach(() => {
        clearTimeouts();
      });

      it('should not have called next', () => {
        expect(next).not.toHaveBeenCalled();
      });
    });
  });
});
