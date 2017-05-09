import reqModule from '@mfl/req';
import fixtures from '../fixtures/standard-fixtures';
import stubDaddyModule from '../../server';
import * as url from 'url';
import streamToPromise from '../../stream-to-promise.js';

import { describe, beforeEach, it, jasmine, expect } from '../jasmine.js';

const port = 8150;

const addError = done => err => {
  expect(err).toEqual(jasmine.any(Error));
  process.removeListener('uncaughtException', addError);
  done();
};

['http', 'https'].forEach(protocol => {
  describe(`integration tests for ${protocol}`, () => {
    let req, webService, makeRequest, stubDaddy, s;
    beforeEach(() => {
      req = reqModule(protocol);
      stubDaddy = stubDaddyModule({ requestProtocol: protocol, port });
      webService = stubDaddy.webService;

      const urlString = `${protocol}://localhost:${port}`;
      makeRequest = makeRequestFactory(urlString, req);

      webService.startService();
    });

    afterEach(done => {
      webService.stopService(done.fail, done);
    });

    describe('register mock api by calling /api/mock', () => {
      describe('with all required fields', () => {
        it('should have a status of 201', async () => {
          s = makeRequest(fixtures.integration.registerMockRequests[6].json);

          const result = await streamToPromise(s);
          expect(result.statusCode).toEqual(201);
        });
      });
    });

    describe('register a mock with a query string', () => {
      let requestOptions;
      beforeEach(() => {
        requestOptions = {
          ...fixtures.integration.registerSuccessfulMockRequest.json
        };
        s = makeRequest(requestOptions);
      });

      it(`should have a status code of 201`, async () => {
        const result = await streamToPromise(s);
        expect(result.statusCode).toEqual(201);
      });

      describe('call registered mock with all required parameters', () => {
        beforeEach(() => {
          const request = {
            path: '/user/profile?user=johndoe&key=abc123',
            headers: requestOptions.json.request.headers
          };

          s = s.flatMap(makeRequest.bind(null, request));
        });

        it(`should have a status code of 200`, async () => {
          const result = await streamToPromise(s);
          expect(result.statusCode).toEqual(200);
        });

        it('should return the expected response body', async () => {
          const result = await streamToPromise(s);
          expect(result.body).toEqual(
            fixtures.integration.registerSuccessfulMockRequest.json.json
              .response.data
          );
        });
      });

      describe('with all required parameters and query parameters reversed', () => {
        beforeEach(() => {
          const request = {
            path: '/user/profile?key=abc123&user=johndoe',
            headers: requestOptions.json.request.headers
          };

          s = s.flatMap(makeRequest.bind(null, request));
        });

        it(`should have a status code of 200`, async () => {
          const result = await streamToPromise(s);
          expect(result.statusCode).toEqual(200);
        });

        it('should return the expected response body', async () => {
          const result = await streamToPromise(s);
          expect(result.body).toEqual(
            fixtures.integration.registerSuccessfulMockRequest.json.json
              .response.data
          );
        });
      });
    });

    describe('register a mock with a timeout of 500ms', () => {
      let requestOptions;
      beforeEach(() => {
        requestOptions = {
          ...fixtures.integration.registerSuccessfulMockRequest.json,
          json: {
            ...fixtures.integration.registerSuccessfulMockRequest.json.json,
            timeout: 500
          }
        };

        s = makeRequest(requestOptions);
      });

      it('should have a status code of 201', async () => {
        const result = await streamToPromise(s);
        expect(result.statusCode).toEqual(201);
      });

      describe('call registered mock', () => {
        beforeEach(() => {
          const request = {
            path: requestOptions.json.request.url,
            headers: requestOptions.json.request.headers
          };

          s = s.flatMap(makeRequest.bind(null, request));
        });

        it(`should have a status code of 200`, async () => {
          const result = await streamToPromise(s);
          expect(result.statusCode).toEqual(200);
        });

        it('should return the expected response body', async () => {
          const result = await streamToPromise(s);
          expect(result.body).toEqual(
            fixtures.integration.registerSuccessfulMockRequest.json.json
              .response.data
          );
        });

        it('should receive response after specified time', async () => {
          const now = Date.now();

          await streamToPromise(s);
          const difference = Date.now() - now;
          expect(500 - difference < 100).toEqual(true);
        });
      });
    });

    describe('register a mock', () => {
      const methods = ['POST', 'PUT', 'PATCH'];
      let requestOptions;

      beforeEach(() => {
        requestOptions = {
          ...fixtures.integration.registerSuccessfulMockPOSTRequest.json
        };
      });

      methods.forEach(method => {
        describe(`having a ${method} method`, () => {
          beforeEach(() => {
            requestOptions = {
              ...requestOptions,
              ...{
                json: {
                  ...requestOptions.json,
                  request: {
                    ...requestOptions.json.request,
                    method
                  }
                }
              }
            };

            s = makeRequest(requestOptions);
          });

          it('should have a status code of 201', async () => {
            const result = await streamToPromise(s);
            expect(result.statusCode).toEqual(201);
          });

          describe('call the mock with all required parameters', () => {
            beforeEach(() => {
              const request = {
                method: method,
                path: requestOptions.json.request.url,
                json: requestOptions.json.request.data,
                headers: requestOptions.json.request.headers
              };

              s = s.flatMap(makeRequest.bind(null, request));
            });

            it('should have a status code of 200', async () => {
              const result = await streamToPromise(s);
              expect(result.statusCode).toEqual(200);
            });

            it('should return the expected response body', async () => {
              const result = await streamToPromise(s);
              expect(result.body).toEqual(
                fixtures.integration.registerSuccessfulMockPOSTRequest.json.json
                  .response.data
              );
            });
          });
        });
      });
    });

    describe('register a mock', () => {
      let requestOptions, callOptions;

      beforeEach(() => {
        requestOptions = {
          ...fixtures.integration.registerRequestForExpireFunctionality.json,
          json: {
            ...fixtures.integration.registerRequestForExpireFunctionality.json
              .json,
            expires: 2
          }
        };

        callOptions = {
          path: requestOptions.json.request.url,
          headers: requestOptions.json.request.headers,
          method: requestOptions.json.request.method,
          json: requestOptions.json.request.data
        };

        s = makeRequest(requestOptions);
      });

      it('should have a status code of 201', async () => {
        const result = await streamToPromise(s);
        expect(result.statusCode).toEqual(201);
      });

      describe('call the mock once', () => {
        beforeEach(() => {
          s = s.flatMap(makeRequest.bind(null, callOptions));
        });

        it('should have a status code of 200', async () => {
          const result = await streamToPromise(s);
          expect(result.statusCode).toEqual(200);
        });

        it('should return the expected response body', async () => {
          const result = await streamToPromise(s);
          expect(result.body).toEqual(
            fixtures.integration.registerRequestForExpireFunctionality.json.json
              .response.data
          );
        });

        describe('call the mock a second time', () => {
          beforeEach(() => {
            s = s.flatMap(makeRequest.bind(null, callOptions));
          });

          it('should have a status code of 200', async () => {
            const result = await streamToPromise(s);
            expect(result.statusCode).toEqual(200);
          });

          it('should return the expected response body', async () => {
            const result = await streamToPromise(s);
            expect(result.body).toEqual(
              fixtures.integration.registerRequestForExpireFunctionality.json
                .json.response.data
            );
          });
        });
      });
    });

    describe('register a mock', () => {
      let requestOptions, callOptions, stateOptions;

      beforeEach(() => {
        requestOptions = {
          ...fixtures.integration.registerRequestForMockState.json
        };

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

      it('should have a status code of 201', async () => {
        const result = await streamToPromise(s);
        expect(result.statusCode).toEqual(201);
      });

      describe('call the mock', () => {
        beforeEach(() => {
          s = s.flatMap(makeRequest.bind(null, callOptions));
        });

        it('should have a status code of 200', async () => {
          const result = await streamToPromise(s);
          expect(result.statusCode).toEqual(200);
        });

        it('should return the expected response body', async () => {
          const result = await streamToPromise(s);
          expect(result.body).toEqual(
            fixtures.integration.registerRequestForMockState.json.json.response
              .data
          );
        });

        describe('check the mock state', () => {
          beforeEach(() => {
            s = s.flatMap(makeRequest.bind(null, stateOptions));
          });

          it('should have a status code of 200', async () => {
            const result = await streamToPromise(s);
            expect(result.statusCode).toEqual(200);
          });

          it('should return the expected response body', async () => {
            const result = await streamToPromise(s);
            expect(result.body).toEqual([]);
          });
        });
      });
    });

    describe('register a mock', () => {
      let requestOptions;
      beforeEach(() => {
        requestOptions = {
          ...fixtures.integration.registerRequestForMockState.json,
          json: {
            ...fixtures.integration.registerRequestForMockState.json.json,
            expires: 2
          }
        };
        requestOptions.json.expires = 2;

        s = makeRequest(requestOptions);
      });

      it('should have a status code of 201', async () => {
        const result = await streamToPromise(s);
        expect(result.statusCode).toEqual(201);
      });

      describe('call the mock', () => {
        let callOptions;
        beforeEach(() => {
          callOptions = {
            path: requestOptions.json.request.url,
            headers: requestOptions.json.request.headers,
            method: requestOptions.json.request.method,
            json: requestOptions.json.request.data
          };

          s = s.flatMap(makeRequest.bind(null, callOptions));
        });

        it('should have a status code of 200', async () => {
          const result = await streamToPromise(s);
          expect(result.statusCode).toEqual(200);
        });

        it('should return the expected response body', async () => {
          const result = await streamToPromise(s);
          expect(result.body).toEqual(
            fixtures.integration.registerRequestForMockState.json.json.response
              .data
          );
        });
      });
    });

    describe('register a mock', () => {
      let requestOptions;
      beforeEach(() => {
        requestOptions = {
          ...fixtures.integration.registerRequestForMockState.json,
          json: {
            ...fixtures.integration.registerRequestForMockState.json.json,
            expires: 1
          }
        };
        requestOptions.json.expires = 1;

        s = makeRequest(requestOptions);
      });

      it('should have a status code of 201', async () => {
        const result = await streamToPromise(s);
        expect(result.statusCode).toEqual(201);
      });

      describe('call the mock', () => {
        let callOptions;
        beforeEach(() => {
          callOptions = {
            path: requestOptions.json.request.url,
            headers: requestOptions.json.request.headers,
            method: requestOptions.json.request.method,
            json: requestOptions.json.request.data
          };

          s = s.flatMap(makeRequest.bind(null, callOptions));
        });

        it('should have a status code of 200', async () => {
          const result = await streamToPromise(s);
          expect(result.statusCode).toEqual(200);
        });

        it('should return the expected response body', async () => {
          const result = await streamToPromise(s);
          expect(result.body).toEqual(
            fixtures.integration.registerRequestForMockState.json.json.response
              .data
          );
        });
      });
    });

    describe('register two mocks', () => {
      let requestOptions1, requestOptions2, callOptions1, callOptions2;
      beforeEach(() => {
        requestOptions1 = {
          ...fixtures.integration.registerRequestWithDynamicResponse.json,
          json: {
            ...fixtures.integration.registerRequestWithDynamicResponse.json
              .json,
            response: {
              ...fixtures.integration.registerRequestWithDynamicResponse.json
                .json.response,
              data: {
                ...fixtures.integration.registerRequestWithDynamicResponse.json
                  .json.response.data,
                state: 'green'
              }
            },
            expires: 1
          }
        };

        requestOptions2 = {
          ...fixtures.integration.registerRequestWithDynamicResponse.json,
          json: {
            ...fixtures.integration.registerRequestWithDynamicResponse.json
              .json,
            response: {
              ...fixtures.integration.registerRequestWithDynamicResponse.json
                .json.response,
              data: {
                ...fixtures.integration.registerRequestWithDynamicResponse.json
                  .json.response.data,
                state: 'yellow'
              }
            }
          }
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

        s = makeRequest(requestOptions1).flatMap(
          makeRequest.bind(null, requestOptions2)
        );
      });

      it('should have a status code of 201', async () => {
        const result = await streamToPromise(s);
        expect(result.statusCode).toEqual(201);
      });

      describe('call the first mock', () => {
        beforeEach(() => {
          s = s.flatMap(makeRequest.bind(null, callOptions1));
        });

        it(`should have a status code of 200`, async () => {
          const result = await streamToPromise(s);
          expect(result.statusCode).toEqual(200);
        });

        it('should return the expected response body', async () => {
          const result = await streamToPromise(s);
          expect(result.body).toEqual({ state: 'green' });
        });

        describe('call the second mock', () => {
          beforeEach(() => {
            s = s.flatMap(makeRequest.bind(null, callOptions2));
          });

          it('should have a status code of 200', async () => {
            const result = await streamToPromise(s);
            expect(result.statusCode).toEqual(200);
          });

          it('should return the expected response body', async () => {
            const result = await streamToPromise(s);
            expect(result.body).toEqual({ state: 'yellow' });
          });
        });
      });
    });

    describe('register mocks with dependencies', () => {
      let standardAlertRequest,
        alertRequest,
        filesystemRequest,
        alertCall,
        filesystemCall;

      beforeEach(() => {
        filesystemRequest = {
          ...fixtures.integration.registerSuccessfulMockPOSTRequest.json,
          json: {
            ...fixtures.integration.registerSuccessfulMockPOSTRequest.json.json,
            request: {
              ...fixtures.integration.registerSuccessfulMockPOSTRequest.json
                .json.request,
              method: 'PUT',
              url: '/api/filesystem/',
              data: {
                ...fixtures.integration.registerSuccessfulMockPOSTRequest.json
                  .json.request.data,
                id: 1
              }
            },
            response: {
              ...fixtures.integration.registerSuccessfulMockPOSTRequest.json
                .json.response,
              data: {}
            },
            expires: 1
          }
        };

        standardAlertRequest = {
          ...fixtures.integration.registerRequestWithDependencies.json,
          json: {
            ...fixtures.integration.registerRequestWithDependencies.json.json,
            response: {
              ...fixtures.integration.registerRequestWithDependencies.json.json
                .response,
              data: {
                ...fixtures.integration.registerRequestWithDependencies.json
                  .json.response.data,
                statusCode: 'invalid'
              }
            },
            dependencies: []
          }
        };

        alertRequest = {
          ...fixtures.integration.registerRequestWithDependencies.json
        };

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

      it('should have a status code of 201', async () => {
        const result = await streamToPromise(s);
        expect(result.statusCode).toEqual(201);
      });

      describe('make the alert call', () => {
        beforeEach(() => {
          s = s.flatMap(makeRequest.bind(null, alertCall));
        });

        it('should have a status code of 200', async () => {
          const result = await streamToPromise(s);
          expect(result.statusCode).toEqual(200);
        });

        it('should return the expected response body', async () => {
          const result = await streamToPromise(s);
          expect(result.body).toEqual({ statusCode: 'invalid' });
        });

        describe('make the filesystem call', () => {
          beforeEach(() => {
            s = s.flatMap(makeRequest.bind(null, filesystemCall));
          });

          it('should have a status code of 200', async () => {
            const result = await streamToPromise(s);
            expect(result.statusCode).toEqual(200);
          });

          it('should return the expected response body', async () => {
            const result = await streamToPromise(s);
            expect(result.body).toEqual({});
          });

          describe('make the alert call again', () => {
            beforeEach(() => {
              s = s.flatMap(makeRequest.bind(null, alertCall));
            });

            it('should have a status code of 200', async () => {
              const result = await streamToPromise(s);
              expect(result.statusCode).toEqual(200);
            });

            it('should return the expected response body', async () => {
              const result = await streamToPromise(s);
              expect(result.body).toEqual({ statusCode: 'OK' });
            });
          });
        });
      });
    });

    describe('register mocks with dependencies using querystring', () => {
      let profileRequest, filesystemRequest, profileCall, filesystemCall;

      beforeEach(() => {
        profileRequest = {
          ...fixtures.integration.registerSuccessfulMockRequest.json,
          json: {
            ...fixtures.integration.registerSuccessfulMockRequest.json.json,
            expires: 1
          }
        };

        filesystemRequest = {
          ...fixtures.integration.registerSuccessfulMockRequest.json,
          json: {
            ...fixtures.integration.registerSuccessfulMockRequest.json.json,
            request: {
              ...fixtures.integration.registerSuccessfulMockRequest.json.json
                .request,
              url: '/usr/filesystem?type=someType'
            },
            response: {
              ...fixtures.integration.registerSuccessfulMockRequest.json.json
                .response,
              data: {
                name: 'my filesystem'
              }
            },
            dependencies: [
              ...fixtures.integration.registerSuccessfulMockRequest.json.json
                .dependencies,
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
        };

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

        s = makeRequest(profileRequest).flatMap(
          makeRequest.bind(null, filesystemRequest)
        );
      });

      it('should have a status code of 201', async () => {
        const result = await streamToPromise(s);
        expect(result.statusCode).toEqual(201);
      });

      describe('make the profile call', () => {
        beforeEach(() => {
          s = s.flatMap(makeRequest.bind(null, profileCall));
        });

        it('should have a status code of 200', async () => {
          const result = await streamToPromise(s);
          expect(result.statusCode).toEqual(200);
        });

        it('should return the expected response body', async () => {
          const result = await streamToPromise(s);
          expect(result.body).toEqual({
            firstName: 'John',
            lastName: 'Doe',
            dob: '1981-09-07',
            city: 'Orlando',
            state: 'FL'
          });
        });

        describe('make the filesystem call', () => {
          beforeEach(() => {
            s = s.flatMap(makeRequest.bind(null, filesystemCall));
          });

          it('should have a status code of 200', async () => {
            const result = await streamToPromise(s);
            expect(result.statusCode).toEqual(200);
          });

          it('should return the expected response body', async () => {
            const result = await streamToPromise(s);
            expect(result.body).toEqual({ name: 'my filesystem' });
          });
        });
      });
    });
  });
});

function makeRequestFactory(urlString, req) {
  const serverHttpUrl = url.parse(urlString);

  return options => {
    if (!options) throw new Error('Options is required to make a request.');

    options = {
      ...options,
      ...{
        strictSSL: false,
        localhost: serverHttpUrl.href,
        host: serverHttpUrl.host,
        hostname: serverHttpUrl.hostname,
        port
      }
    };

    return req.bufferJsonRequest(options);
  };
}
