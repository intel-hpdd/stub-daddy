import dotty from 'dotty';

import { describe, beforeEach, it, expect } from '../jasmine.js';

let registerApiValidator;

describe('test register api body against validator', () => {
  let body;
  const config = {
    methods: {
      POST: 'POST'
    }
  };

  beforeEach(() => {
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

    registerApiValidator = require('../../validators/register-api-validator')
      .default;
  });

  it('should validate the body with a successful response', () => {
    const result = registerApiValidator(body);
    expect(result.errors.length).toEqual(0);
  });

  it('should validate a string with a failed response', () => {
    const result = registerApiValidator('some string');

    expect(result.errors).toEqual([
      {
        property: 'instance',
        message: 'is not of a type(s) object',
        schema: '/RegisterApi',
        instance: 'some string',
        name: 'type',
        argument: jasmine.any(Object),
        stack: 'instance is not of a type(s) object'
      }
    ]);
  });

  it('should validate an undefined body with a failed response', () => {
    const result = registerApiValidator(undefined);
    expect(result.errors.length).toEqual(1);
  });

  it('should validate a null body with a failed response', () => {
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
  bodyComponents.forEach(element => {
    it('should validate the body with a failed response due to a missing required field', () => {
      dotty.remove(body, element);
      const result = registerApiValidator(body);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
