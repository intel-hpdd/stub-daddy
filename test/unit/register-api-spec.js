/*jshint node: true*/
'use strict';

var configulator = require('configulator');
var configModule = require('../../config').wiretree;
var modelsModule = require('../../models').wiretree;
var registerAPIModule = require('../../register-api').wiretree;
var url = require('url');
var querystring = require('querystring');

describe('register api module', function () {

  var registerResponse, registerApiValidator, registerAPI, entryRequest, entryResponse, request, body, requestStore,
    config, entryDependencies, models;
  beforeEach(function () {
    config = configModule(configulator);
    models = modelsModule(config, url, querystring);
    var logger;

    body = {
      request: {
        method: config.methods.GET,
        url: '/some/path',
        data: {},
        headers: {headerKey: 'header value'}
      },
      response: {
        status: '200',
        data: {dataKey: 'data value'},
        headers: {headerKey: 'header value'}
      },
      dependencies: [
        {
          method: config.methods.PUT,
          url: '/put/path',
          data: {key: 'value'},
          headers: {headerKey: 'header value'}
        }
      ],
      expires: 0
    };
    request = {
      method: config.methods.POST
    };

    entryRequest = new models.Request(
      body.request.method,
      body.request.url,
      body.request.data,
      body.request.headers
    );

    entryResponse = new models.Response(
      body.response.status,
      body.response.headers,
      body.response.data
    );

    entryDependencies = [
      new models.Request(
        body.dependencies[0].method,
        body.dependencies[0].url,
        body.dependencies[0].data,
        body.dependencies[0].headers
      )
    ];

    requestStore = jasmine.createSpyObj('requestStore', ['addEntry']);

    logger = jasmine.createSpyObj('logger', ['info', 'debug', 'trace']);
    registerApiValidator = jasmine.createSpy('registerApiValidator');
    registerAPI = registerAPIModule(requestStore, models, config, registerApiValidator, logger);
  });

  describe('successfully register a mock api with a body in the correct format', function () {
    var json;
    beforeEach(function () {
      json = {
        returnedFromRegisterApiValidator: {
          errors: []
        },
        status: 201
      };

      registerApiValidator.and.returnValue(json.returnedFromRegisterApiValidator);
    });

    it('should call requestStore.addEntry with entryRequest, entryResponse, body.expires, and entry dependencies',
      function () {
        registerResponse = registerAPI(request, body);
        expect(requestStore.addEntry).toHaveBeenCalledWith(entryRequest, entryResponse, body.expires, [{
          request: entryDependencies[0],
          response: undefined
        }]);
      });

    it('should include dependency response if specified', function () {
      body.dependencies[0] = {
        request: {
          method: config.methods.PUT,
          url: '/put/path',
          data: {key: 'value'},
          headers: {headerKey: 'header value'}
        },
        response: {
          status: 200,
          headers: {},
          data: {key: 'value'}
        }
      };
      registerAPI(request, body);

      expect(requestStore.addEntry).toHaveBeenCalledWith(entryRequest, entryResponse, body.expires, [{
        request: entryDependencies[0],
        response: new models.Response(
          body.dependencies[0].response.status,
          body.dependencies[0].response.headers,
          body.dependencies[0].response.data
        )
      }]);
    });

    it('should call registerApiValidator with body', function () {
      registerResponse = registerAPI(request, body);
      expect(registerApiValidator).toHaveBeenCalledWith(body);
    });

    it('should have a status of 201', function () {
      registerResponse = registerAPI(request, body);
      expect(registerResponse.status).toEqual(201);
    });
  });

  describe('failure in registering mock api due to body in invalid format', function () {
    var json;
    beforeEach(function () {
      json = {
        returnedFromRegisterApiValidator: {
          errors: ['some error']
        },
        status: 400
      };

      registerApiValidator.and.returnValue(json.returnedFromRegisterApiValidator);
      registerResponse = registerAPI(request, body);
    });

    it('should not call requestStore.addEntry', function () {
      expect(requestStore.addEntry).not.toHaveBeenCalled();
    });

    it('should call registerApiValidator with body', function () {
      expect(registerApiValidator).toHaveBeenCalledWith(body);
    });

    it('should have a status of 400', function () {
      expect(registerResponse.status).toEqual(400);
    });
  });

  describe('failure due to wrong request method', function () {
    var json;
    beforeEach(function () {
      json = {
        returnedFromRegisterApiValidator: {
          errors: ['another error']
        },
        status: 400
      };
      request.method = config.methods.GET;

      registerApiValidator.and.returnValue(json.returnedFromRegisterApiValidator);
      registerResponse = registerAPI(request, body);
    });

    it('should not call requestStore.addEntry', function () {
      expect(requestStore.addEntry).not.toHaveBeenCalled();
    });

    it('should not call registerApiValidator with body', function () {
      expect(registerApiValidator).not.toHaveBeenCalledWith();
    });

    it('should have a status of 400', function () {
      expect(registerResponse.status).toEqual(400);
    });
  });
});
