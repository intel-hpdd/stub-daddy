import dotty from 'dotty';
let registerApiValidator;

describe('test register api body against validator', function() {
  let body;
  const config = {
    methods: {
      POST: 'POST'
    }
  };

  beforeEach(function() {
    body = {
      request: {
        method: config.methods.POST,
        url: '/user/profile',
        data: {
          user: 'johndoe',
          key: 'abc123'
        },
        headers: {
          authorization: 'BEARER token55'
        }
      },
      response: {
        statusCode: 200,
        data: {
          firstName: 'John',
          lastName: 'Doe',
          dob: '1981-09-07',
          city: 'Orlando',
          state: 'FL'
        },
        headers: {
          authorization: 'BEARER token55'
        }
      },
      expires: 0,
      dependencies: [
        {
          method: 'PUT',
          url: '/api/filesystem/',
          data: {},
          headers: {}
        }
      ]
    };

    registerApiValidator = require('../../validators/register-api-validator');
  });

  it('should validate the body with a successful response', function() {
    const result = registerApiValidator(body);
    expect(result.errors.length).toEqual(0);
  });

  it('should validate a string with a failed response', function() {
    const result = registerApiValidator('some string');
    expect(result.errors.length).toEqual(5);
  });

  it('should validate an undefined body with a failed response', function() {
    const result = registerApiValidator(undefined);
    expect(result.errors.length).toEqual(1);
  });

  it('should validate a null body with a failed response', function() {
    const result = registerApiValidator(null);
    expect(result.errors.length).toEqual(1);
  });

  const bodyComponents = [
    'request.method',
    'request.url',
    'request.data',
    'request.headers',
    'response.statusCode',
    'response.data',
    'response.headers',
    'expires',
    'request',
    'response'
  ];
  bodyComponents.forEach(function(element) {
    it('should validate the body with a failed response due to a missing required field', function() {
      dotty.remove(body, element);
      const result = registerApiValidator(body);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
