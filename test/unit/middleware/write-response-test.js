const writeResponse = require('../../../middleware/write-response');

describe('write response middleware', function() {
  let req, res, next, response;

  beforeEach(function() {
    next = jasmine.createSpy('next');
  });

  describe('using web service', function() {
    beforeEach(function() {
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

    describe('with data', function() {
      beforeEach(function() {
        response.data = { name: 'will' };
        writeResponse(req, res, response, next);
      });

      it('should write data', function() {
        expect(res.clientRes.write).toHaveBeenCalledOnceWith('{"name":"will"}');
      });
    });

    describe('without data', function() {
      beforeEach(function() {
        writeResponse(req, res, response, next);
      });

      it('should not write data', function() {
        expect(res.clientRes.write).not.toHaveBeenCalled();
      });
    });

    it('should call writeHead', function() {
      writeResponse(req, res, response, next);
      expect(res.clientRes.writeHead).toHaveBeenCalledOnceWith(
        200,
        response.headers
      );
    });

    it('should call end', function() {
      writeResponse(req, res, response, next);
      expect(res.clientRes.end).toHaveBeenCalledOnce();
    });
  });

  describe('using inline service', function() {
    beforeEach(function() {
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

    it('should call next', function() {
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
