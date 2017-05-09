import writeResponse from '../../../middleware/write-response';

import { describe, beforeEach, it, jasmine, expect } from '../../jasmine.js';

describe('write response middleware', () => {
  let req, res, next, response;

  beforeEach(() => {
    next = jasmine.createSpy('next');
  });

  describe('using web service', () => {
    beforeEach(() => {
      req = {};
      res = {
        clientRes: {
          writeHead: jasmine.createSpy('writeHead'),
          write: jasmine.createSpy('write'),
          end: jasmine.createSpy('end')
        }
      };
      response = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        }
      };
    });

    describe('with data', () => {
      beforeEach(() => {
        response.data = { name: 'will' };
        writeResponse(req, res, response, next);
      });

      it('should write data', () => {
        expect(res.clientRes.write).toHaveBeenCalledOnceWith('{"name":"will"}');
      });
    });

    describe('without data', () => {
      beforeEach(() => {
        writeResponse(req, res, response, next);
      });

      it('should write an empty object', () => {
        expect(res.clientRes.write).toHaveBeenCalledOnceWith('{}');
      });
    });

    it('should call writeHead', () => {
      writeResponse(req, res, response, next);
      expect(res.clientRes.writeHead).toHaveBeenCalledOnceWith(
        200,
        response.headers
      );
    });

    it('should call end', () => {
      writeResponse(req, res, response, next);
      expect(res.clientRes.end).toHaveBeenCalledOnce();
    });
  });

  describe('using inline service', () => {
    beforeEach(() => {
      req = {};
      res = {
        clientRes: {}
      };

      response = {
        statusCode: 200,
        headers: {
          'content-type': 'application/json'
        },
        data: {
          foo: 'bar'
        }
      };

      writeResponse(req, res, response, next);
    });

    it('should call next', () => {
      expect(next).toHaveBeenCalledOnceWith(
        req,
        {
          clientRes: {}
        },
        {
          statusCode: 200,
          headers: {
            'content-type': 'application/json'
          },
          data: {
            foo: 'bar'
          }
        }
      );
    });
  });
});
