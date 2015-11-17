'use strict';

var reqModule = require('intel-req');
var format = require('util').format;
var fixtures = require('../fixtures/standard-fixtures');
var obj = require('intel-obj');
var stubDaddyModule = require('../../server');
var url = require('url');
var fp = require('intel-fp/dist/fp');
var errors;

['http', 'https'].forEach(function testIntegrationTestsWithSecureAndNonSecureUrls(protocol) {
  describe(format('integration tests for %s', protocol), function () {
    var config, req, webService, makeRequest, stubDaddy, addError, spy, s;
    beforeEach(function () {
      spy = jasmine.createSpy('spy');
      req = reqModule(protocol);
      stubDaddy = stubDaddyModule({requestProtocol: protocol});
      config = stubDaddy.config;
      webService = stubDaddy.webService;

      var urlString = format('%s://localhost:%s', config.get('requestProtocol'), config.get('port'));
      makeRequest = makeRequestFactory(urlString, req);

      webService.startService();

      errors = [];
      addError = errors.push.bind(errors);
      process.on('uncaughtException', addError);
    });

    afterEach(function (done) {
      errors.length = 0;
      process.removeListener('uncaughtException', addError);

      webService.stopService(done.fail, done);
    });

    function shouldThrowError (err) {
      it('should throw an error', function (done) {
        s.errors(spy)
          .done(function () {
            expect(spy).toHaveBeenCalledOnceWith(err, jasmine.any(Function));
            done();
          });
      });
    }

    function shouldCauseStubDaddyToCrashWithError () {
      it('should have ended stub daddy', function (done) {
        s.errors(spy)
          .done(function () {
            expect(errors[0]).toEqual(jasmine.any(Error));
            done();
          });
      });
    }

    function shouldNotCauseStubDaddyToCrash () {
      it('should not have ended stub daddy', function (done) {
        s.done(function () {
          expect(errors.length).toEqual(0);
          done();
        });
      });
    }

    function shouldHaveErrorStatusOf (code) {
      it(format('should have a status code of %s', code), function (done) {
        s.errors(spy)
          .done(function () {
            expect(spy.calls.argsFor(0)[0].statusCode).toEqual(code);
            done();
          });
      });
    }

    function shouldHaveStatusOf (code) {
      it(format('should have a status code of %s', code), function (done) {
        s.each(spy)
          .done(function () {
            expect(spy.calls.argsFor(0)[0].statusCode).toEqual(code);
            done();
          });
      });
    }

    function shouldReturnResponseBody (body) {
      it('should return the expected response body', function (done) {
        s.each(spy)
          .done(function () {
            expect(spy.calls.argsFor(0)[0].body).toEqual(body);
            done();
          });
      });
    }

    function shouldReceiveResponseAfterTimeout (timeout) {
      it('should receive response after specified time', function (done) {
        var now = Date.now();
        s.each(spy)
          .done(function () {
            var difference = Date.now() - now;
            expect(timeout - difference < 100).toEqual(true);
            done();
          });
      });
    }

    describe('register mock api by calling /api/mock', function () {
      describe('when calling /api/mock with a GET', function () {
        beforeEach(function () {
          s = makeRequest({path: '/api/mock'});
        });

        shouldThrowError(new Error(' From GET request to /api/mock/'));
        shouldCauseStubDaddyToCrashWithError();
        shouldHaveErrorStatusOf(404);
      });

      describe('without response and expires', function () {
        beforeEach(function () {
          s = makeRequest(fixtures.integration.registerMockRequests[0].json);
        });

        shouldThrowError(new Error(' From POST request to /api/mock/'));
        shouldCauseStubDaddyToCrashWithError();
        shouldHaveErrorStatusOf(400);
      });

      describe('without request and expires', function () {
        beforeEach(function () {
          s = makeRequest(fixtures.integration.registerMockRequests[1].json);
        });

        shouldThrowError(new Error(' From POST request to /api/mock/'));
        shouldCauseStubDaddyToCrashWithError();
        shouldHaveErrorStatusOf(400);
      });

      describe('without request and response', function () {
        beforeEach(function () {
          s = makeRequest(fixtures.integration.registerMockRequests[2].json);
        });

        shouldThrowError(new Error(' From POST request to /api/mock/'));
        shouldCauseStubDaddyToCrashWithError();
        shouldHaveErrorStatusOf(400);
      });

      describe('without expires', function () {
        beforeEach(function () {
          s = makeRequest(fixtures.integration.registerMockRequests[3].json);
        });

        shouldThrowError(new Error(' From POST request to /api/mock/'));
        shouldCauseStubDaddyToCrashWithError();
        shouldHaveErrorStatusOf(400);
      });

      describe('without response', function () {
        beforeEach(function () {
          s = makeRequest(fixtures.integration.registerMockRequests[4].json);
        });

        shouldThrowError(new Error(' From POST request to /api/mock/'));
        shouldCauseStubDaddyToCrashWithError();
        shouldHaveErrorStatusOf(400);
      });

      describe('with all required fields', function () {
        beforeEach(function () {
          s = makeRequest(fixtures.integration.registerMockRequests[6].json);
        });

        shouldNotCauseStubDaddyToCrash();
        shouldHaveStatusOf(201);
      });
    });

    describe('register a mock with a query string', function () {
      var requestOptions;
      beforeEach(function () {
        requestOptions = obj.clone(fixtures.integration.registerSuccessfulMockRequest.json);
        s = makeRequest(requestOptions);
      });

      shouldHaveStatusOf(201);

      describe('call registered mock with all required parameters', function () {
        beforeEach(function () {
          var request = {
            path: '/user/profile?user=johndoe&key=abc123',
            headers: requestOptions.json.request.headers
          };

          s = s.flatMap(makeRequest.bind(null, request));
        });

        shouldHaveStatusOf(200);
        shouldReturnResponseBody(fixtures.integration.registerSuccessfulMockRequest.json.json.response.data);
      });

      describe('with all required parameters and query parameters reversed', function () {
        beforeEach(function () {
          var request = {
            path: '/user/profile?key=abc123&user=johndoe',
            headers: requestOptions.json.request.headers
          };

          s = s.flatMap(makeRequest.bind(null, request));
        });

        shouldHaveStatusOf(200);
        shouldReturnResponseBody(fixtures.integration.registerSuccessfulMockRequest.json.json.response.data);
      });

      describe('with missing parameter', function () {
        beforeEach(function () {
          var request = {
            path: '/user/profile?key=abc123',
            headers: requestOptions.json.request.headers
          };

          s = s.flatMap(makeRequest.bind(null, request));
        });

        shouldHaveErrorStatusOf(404);
        shouldThrowError(new Error(' From GET request to /user/profile?key=abc123/'));
        shouldCauseStubDaddyToCrashWithError();
      });

      describe('with non-matching header', function () {
        beforeEach(function () {
          var request = {
            path: '/user/profile?key=abc123&user=johndoe',
            headers: {
              authorization: 'BEARER token5'
            }
          };

          s = s.flatMap(makeRequest.bind(null, request));
        });

        shouldHaveErrorStatusOf(404);
        shouldThrowError(new Error(' From GET request to /user/profile?key=abc123&user=johndoe/'));
        shouldCauseStubDaddyToCrashWithError();
      });

      describe('with non-matching header', function () {
        beforeEach(function () {
          var request = {
            path: '/user/profile?key=abc123&user=johndoe',
            headers: {}
          };

          s = s.flatMap(makeRequest.bind(null, request));
        });

        shouldHaveErrorStatusOf(404);
        shouldThrowError(new Error(' From GET request to /user/profile?key=abc123&user=johndoe/'));
        shouldCauseStubDaddyToCrashWithError();
      });
    });

    describe('register a mock with a timeout of 500ms', function () {
      var requestOptions;
      beforeEach(function () {
        requestOptions = obj.merge({}, fixtures.integration.registerSuccessfulMockRequest.json);
        requestOptions.json.timeout = 500;

        s = makeRequest(requestOptions);
      });

      shouldHaveStatusOf(201);

      describe('call registered mock', function () {
        beforeEach(function () {
          var request = {
            path: requestOptions.json.request.url,
            headers: requestOptions.json.request.headers
          };

          s = s.flatMap(makeRequest.bind(null, request));
        });

        shouldHaveStatusOf(200);
        shouldReturnResponseBody(fixtures.integration.registerSuccessfulMockRequest.json.json.response.data);
        shouldReceiveResponseAfterTimeout(500);
      });
    });

    describe('register a mock', function () {
      var methods = ['POST', 'PUT', 'PATCH'];
      var requestOptions;

      beforeEach(function () {
        requestOptions = obj.merge({}, fixtures.integration.registerSuccessfulMockPOSTRequest.json);
      });

      methods.forEach(function (method) {

        describe(format('having a %s method', method), function () {
          beforeEach(function () {
            requestOptions.json.request.method = method;
            s = makeRequest(requestOptions);
          });

          shouldHaveStatusOf(201);

          describe('call the mock with all required parameters', function () {
            beforeEach(function () {
              var request = {
                method: method,
                path: requestOptions.json.request.url,
                json: requestOptions.json.request.data,
                headers: requestOptions.json.request.headers
              };

              s = s.flatMap(makeRequest.bind(null, request));
            });

            shouldHaveStatusOf(200);
            shouldReturnResponseBody(fixtures.integration.registerSuccessfulMockPOSTRequest.json.json.response.data);
          });

          describe('call the mock with missing parameter', function () {
            beforeEach(function () {
              var request = {
                method: method,
                path: requestOptions.json.request.url,
                body: {key: 'abc123'},
                headers: requestOptions.json.request.headers
              };

              s = s.flatMap(makeRequest.bind(null, request));
            });

            shouldHaveErrorStatusOf(404);
            shouldThrowError(new Error(format(' From %s request to /user/profile/', method)));
            shouldCauseStubDaddyToCrashWithError();
          });

          describe('call the mock with incorrect header', function () {
            beforeEach(function () {
              var request = {
                method: method,
                path: requestOptions.json.request.url,
                body: requestOptions.json.request.data,
                headers: {
                  authorization: 'BEARER token5'
                }
              };

              s = s.flatMap(makeRequest.bind(null, request));
            });

            shouldHaveErrorStatusOf(404);
            shouldThrowError(new Error(format(' From %s request to /user/profile/', method)));
            shouldCauseStubDaddyToCrashWithError();
          });

          describe('call the mock without required header', function () {
            beforeEach(function () {
              var request = {
                method: requestOptions.json.request.method,
                path: requestOptions.json.request.url,
                body: JSON.stringify(requestOptions.json.request.data),
                headers: {}
              };

              s = s.flatMap(makeRequest.bind(null, request));
            });

            shouldHaveErrorStatusOf(404);
            shouldThrowError(new Error(format(' From %s request to /user/profile/', method)));
            shouldCauseStubDaddyToCrashWithError();
          });
        });

      });
    });

    describe('register a mock', function () {
      var requestOptions, callOptions;

      beforeEach(function () {
        requestOptions = obj.merge({}, fixtures.integration.registerRequestForExpireFunctionality.json);
        requestOptions.json.expires = 2;

        callOptions = {
          path: requestOptions.json.request.url,
          headers: requestOptions.json.request.headers,
          method: requestOptions.json.request.method,
          json: requestOptions.json.request.data
        };

        s = makeRequest(requestOptions);
      });

      shouldHaveStatusOf(201);

      describe('call the mock once', function () {
        beforeEach(function () {
          s = s.flatMap(makeRequest.bind(null, callOptions));
        });

        shouldHaveStatusOf(200);
        shouldReturnResponseBody(fixtures.integration.registerRequestForExpireFunctionality.json.json.response.data);

        describe('call the mock a second time', function () {
          beforeEach(function () {
            s = s.flatMap(makeRequest.bind(null, callOptions));
          });

          shouldHaveStatusOf(200);
          shouldReturnResponseBody(fixtures.integration.registerRequestForExpireFunctionality.json.json.response.data);

          describe('call the mock a third time, past the expiration', function () {
            beforeEach(function () {
              s = s.flatMap(makeRequest.bind(null, callOptions));
            });

            shouldHaveErrorStatusOf(404);
            shouldThrowError(new Error(' From POST request to /user/profile/'));
            shouldCauseStubDaddyToCrashWithError(shouldCauseStubDaddyToCrashWithError);
          });
        });
      });
    });

    describe('register a mock', function () {
      var requestOptions, callOptions, stateOptions;

      beforeEach(function () {
        requestOptions = obj.merge({}, fixtures.integration.registerRequestForMockState.json);

        callOptions = {
          path: requestOptions.json.request.url,
          headers: requestOptions.json.request.headers,
          method: requestOptions.json.request.method,
          json: requestOptions.json.request.data
        };

        stateOptions = {
          path: '/api/mockstate',
          method: 'GET'
        };

        s = makeRequest(requestOptions);
      });

      shouldHaveStatusOf(201);

      describe('call the mock', function () {
        beforeEach(function () {
          s = s.flatMap(makeRequest.bind(null, callOptions));
        });

        shouldHaveStatusOf(200);
        shouldReturnResponseBody(fixtures.integration.registerRequestForMockState.json.json.response.data);

        describe('check the mock state', function () {
          beforeEach(function () {
            s = s.flatMap(makeRequest.bind(null, stateOptions));
          });

          shouldHaveStatusOf(200);
          shouldReturnResponseBody([]);
        });
      });

      describe('send a request that is not registered', function () {
        beforeEach(function () {
          callOptions.json = {
            user: 'johndoe',
            key: '123abc'
          };

          s = s.flatMap(makeRequest.bind(null, callOptions));
        });

        shouldHaveErrorStatusOf(404);
        shouldThrowError(new Error(' From POST request to /user/profile/'));
        shouldCauseStubDaddyToCrashWithError();

        describe('check the mock state', function () {
          beforeEach(function () {
            s = s.errors(fp.flip(2, fp.flow(fp.invoke(fp.__, [null, undefined]))))
              .flatMap(makeRequest.bind(null, stateOptions));
          });

          shouldHaveErrorStatusOf(400);
          shouldThrowError(jasmine.any(Error));

          shouldCauseStubDaddyToCrashWithError();
        });
      });
    });

    describe('register a mock', function () {
      var requestOptions;
      beforeEach(function () {
        requestOptions = obj.merge({}, fixtures.integration.registerRequestForMockState.json);
        requestOptions.json.expires = 2;

        s = makeRequest(requestOptions);
      });

      shouldHaveStatusOf(201);

      describe('call the mock', function () {
        var callOptions;
        beforeEach(function () {
          callOptions = {
            path: requestOptions.json.request.url,
            headers: requestOptions.json.request.headers,
            method: requestOptions.json.request.method,
            json: requestOptions.json.request.data
          };

          s = s.flatMap(makeRequest.bind(null, callOptions));
        });

        shouldHaveStatusOf(200);
        shouldReturnResponseBody(fixtures.integration.registerRequestForMockState.json.json.response.data);

        describe('check the mock state', function () {
          var stateOptions;
          beforeEach(function () {
            stateOptions = {
              path: '/api/mockstate',
              method: 'GET'
            };

            s = s.flatMap(makeRequest.bind(null, stateOptions));
          });

          shouldHaveErrorStatusOf(400);
          shouldThrowError(jasmine.any(Error));

          shouldCauseStubDaddyToCrashWithError(jasmine.any(Error));
        });
      });
    });

    describe('register a mock', function () {
      var requestOptions;
      beforeEach(function () {
        requestOptions = obj.merge({}, fixtures.integration.registerRequestForMockState.json);
        requestOptions.json.expires = 1;

        s = makeRequest(requestOptions);
      });

      shouldHaveStatusOf(201);

      describe('call the mock', function () {
        var callOptions;
        beforeEach(function () {
          callOptions = {
            path: requestOptions.json.request.url,
            headers: requestOptions.json.request.headers,
            method: requestOptions.json.request.method,
            json: requestOptions.json.request.data
          };

          s = s.flatMap(makeRequest.bind(null, callOptions));
        });

        shouldHaveStatusOf(200);
        shouldReturnResponseBody(fixtures.integration.registerRequestForMockState.json.json.response.data);

        describe('call the mock again after being expired', function () {
          beforeEach(function () {
            s = s.flatMap(makeRequest.bind(null, callOptions));
          });

          shouldHaveErrorStatusOf(404);
          shouldThrowError(new Error(' From POST request to /user/profile/', jasmine.any(Function)));
          shouldCauseStubDaddyToCrashWithError();

          describe('check the mock state', function () {
            var stateOptions;
            beforeEach(function () {
              stateOptions = {
                path: '/api/mockstate',
                method: 'GET'
              };

              s = s
                .errors(fp.flip(2, fp.flow(fp.invoke(fp.__, [null, undefined]))))
                .flatMap(makeRequest.bind(null, stateOptions));
            });

            shouldHaveErrorStatusOf(400);
            shouldThrowError(jasmine.any(Error));

            shouldCauseStubDaddyToCrashWithError();
          });
        });
      });
    });

    describe('register two mocks', function () {
      var requestOptions1, requestOptions2, callOptions1, callOptions2;
      beforeEach(function () {
        requestOptions1 = obj.merge({}, fixtures.integration.registerRequestWithDynamicResponse.json);
        requestOptions1.json.response.data = {
          state: 'green'
        };
        requestOptions1.json.expires = 1;

        requestOptions2 = obj.merge({}, fixtures.integration.registerRequestWithDynamicResponse.json);
        requestOptions2.json.response.data = {
          state: 'yellow'
        };

        callOptions1 = {
          path: requestOptions1.json.request.url,
          headers: requestOptions1.json.request.headers,
          method: requestOptions1.json.request.method,
          json: requestOptions1.json.request.data
        };

        callOptions2 = {
          path: requestOptions1.json.request.url,
          headers: requestOptions1.json.request.headers,
          method: requestOptions1.json.request.method,
          json: requestOptions2.json.request.data
        };

        s = makeRequest(requestOptions1)
          .flatMap(makeRequest.bind(null, requestOptions2));
      });

      shouldHaveStatusOf(201);

      describe('call the first mock', function () {
        beforeEach(function () {
          s = s.flatMap(makeRequest.bind(null, callOptions1));
        });

        shouldHaveStatusOf(200);
        shouldReturnResponseBody({state: 'green'});

        describe('call the second mock', function () {
          beforeEach(function () {
            s = s.flatMap(makeRequest.bind(null, callOptions2));
          });

          shouldHaveStatusOf(200);
          shouldReturnResponseBody({state: 'yellow'});
        });
      });
    });

    describe('register mocks with dependencies', function () {
      var standardAlertRequest, alertRequest, filesystemRequest, alertCall, filesystemCall;

      beforeEach(function () {
        filesystemRequest = obj.merge({}, fixtures.integration.registerSuccessfulMockPOSTRequest.json, {
          json: {
            request: {
              method: 'PUT',
              url: '/api/filesystem/'
            },
            expires: 1
          }
        });
        filesystemRequest.json.request.data = {id: 1};
        filesystemRequest.json.response.data = {};
        standardAlertRequest = obj.merge({}, fixtures.integration.registerRequestWithDependencies.json, {
          json: {
            response: {
              data: {
                statusCode: 'invalid'
              }
            }
          }
        });
        standardAlertRequest.json.dependencies = [];
        alertRequest = obj.merge({}, fixtures.integration.registerRequestWithDependencies.json);

        alertCall = {
          path: alertRequest.json.request.url,
          headers: alertRequest.json.request.headers,
          method: alertRequest.json.request.method,
          json: alertRequest.json.request.data
        };

        filesystemCall = {
          path: filesystemRequest.json.request.url,
          headers: filesystemRequest.json.request.headers,
          method: filesystemRequest.json.request.method,
          json: filesystemRequest.json.request.data
        };

        s = makeRequest(alertRequest)
          .flatMap(makeRequest.bind(null, standardAlertRequest))
          .flatMap(makeRequest.bind(null, filesystemRequest));
      });

      shouldHaveStatusOf(201);

      describe('make the alert call', function () {
        beforeEach(function () {
          s = s.flatMap(makeRequest.bind(null, alertCall));
        });

        shouldHaveStatusOf(200);
        shouldReturnResponseBody({statusCode: 'invalid'});

        describe('make the filesystem call', function () {
          beforeEach(function () {
            s = s.flatMap(makeRequest.bind(null, filesystemCall));
          });

          shouldHaveStatusOf(200);
          shouldReturnResponseBody({});

          describe('make the alert call again', function () {
            beforeEach(function () {
              s = s.flatMap(makeRequest.bind(null, alertCall));
            });

            shouldHaveStatusOf(200);
            shouldReturnResponseBody({statusCode: 'OK'});
          });
        });
      });
    });

    describe('register mocks with dependencies using querystring', function () {
      var profileRequest, filesystemRequest, profileCall, filesystemCall;

      beforeEach(function () {
        profileRequest = obj.merge({}, fixtures.integration.registerSuccessfulMockRequest.json, {
          json: {
            expires: 1
          }
        });

        filesystemRequest = obj.merge({}, fixtures.integration.registerSuccessfulMockRequest.json, {
          json: {
            request: {
              url: '/usr/filesystem?type=someType'
            },
            dependencies: [
              {
                method: 'GET',
                url: '/user/profile?user=johndoe&key=abc123',
                data: {},
                headers: {
                  authorization: 'BEARER token55'
                }
              }
            ]
          }
        });
        filesystemRequest.json.response.data = {name: 'my filesystem'};

        profileCall = {
          path: profileRequest.json.request.url,
          headers: profileRequest.json.request.headers,
          method: profileRequest.json.request.method,
          json: profileRequest.json.request.data
        };

        filesystemCall = {
          path: filesystemRequest.json.request.url,
          headers: filesystemRequest.json.request.headers,
          method: filesystemRequest.json.request.method,
          json: filesystemRequest.json.request.data
        };

        s = makeRequest(profileRequest)
          .flatMap(makeRequest.bind(null, filesystemRequest));
      });

      shouldHaveStatusOf(201);

      describe('make the filesystem call', function () {
        beforeEach(function () {
          s = s.flatMap(makeRequest.bind(null, filesystemCall));
        });

        shouldHaveErrorStatusOf(404);
        shouldThrowError(new Error(' From GET request to /usr/filesystem?type=someType/', jasmine.any(Function)));
        shouldCauseStubDaddyToCrashWithError();
      });

      describe('make the profile call', function () {
        beforeEach(function () {
          s = s.flatMap(makeRequest.bind(null, profileCall));
        });

        shouldHaveStatusOf(200);
        shouldReturnResponseBody({
          firstName: 'John',
          lastName: 'Doe',
          dob: '1981-09-07',
          city: 'Orlando',
          state: 'FL'
        });

        describe('make the filesystem call', function () {
          beforeEach(function () {
            s = s.flatMap(makeRequest.bind(null, filesystemCall));
          });

          shouldHaveStatusOf(200);

          shouldReturnResponseBody({
            name: 'my filesystem'
          });
        });
      });
    });
  });
});

function makeRequestFactory(urlString, req) {
  var serverHttpUrl = url.parse(urlString);

  return function makeRequest(options) {
    if (!options)
      throw new Error('Options is required to make a request.');

    options = obj.merge({}, options, {
      strictSSL: false,
      headers: {
        'Connection': 'close'
      },
      localhost: serverHttpUrl.href,
      host: serverHttpUrl.host,
      hostname: serverHttpUrl.hostname,
      port: serverHttpUrl.port
    });

    return req.bufferRequest(options);
  };
}
