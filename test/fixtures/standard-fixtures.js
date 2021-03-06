const fixtures = {
  integration: {
    registerMockRequests: [
      {
        json: {
          path: '/api/mock',
          method: 'POST',
          json: {
            request: {
              method: 'GET',
              url: '/target',
              data: {},
              headers: {}
            }
          }
        },
        statusCode: 400
      },
      {
        json: {
          path: '/api/mock',
          method: 'POST',
          json: {
            response: {
              statusCode: 200,
              json: {
                name: 'will'
              },
              headers: {
                'content-type': 'application/json'
              }
            }
          }
        },
        statusCode: 400
      },
      {
        json: {
          path: '/api/mock',
          method: 'POST',
          json: {
            expires: 0
          }
        },
        statusCode: 400
      },
      {
        json: {
          path: '/api/mock',
          method: 'POST',
          json: {
            request: {
              method: 'GET',
              url: '/target',
              data: {},
              headers: {}
            },
            response: {
              statusCode: 200,
              data: {
                name: 'will'
              },
              headers: {
                'content-type': 'application/json'
              }
            }
          }
        },
        statusCode: 400
      },
      {
        json: {
          path: '/api/mock',
          method: 'POST',
          json: {
            request: {
              method: 'GET',
              url: '/target',
              data: {},
              headers: {}
            },
            expires: 0
          }
        },
        statusCode: 400
      },
      {
        json: {
          path: '/api/mock',
          method: 'POST',
          json: {
            response: {
              statusCode: 200,
              data: {
                name: 'will'
              },
              headers: {
                'content-type': 'application/json'
              }
            },
            expires: 0
          }
        },
        statusCode: 400
      },
      {
        json: {
          path: '/api/mock',
          method: 'POST',
          json: {
            request: {
              method: 'GET',
              url: '/target',
              data: {},
              headers: {}
            },
            response: {
              statusCode: 200,
              data: {
                name: 'will'
              },
              headers: {
                'content-type': 'application/json'
              }
            },
            expires: 0,
            dependencies: []
          }
        },
        statusCode: 201
      }
    ],
    registerSuccessfulMockRequest: {
      json: {
        path: '/api/mock',
        method: 'POST',
        json: {
          request: {
            method: 'GET',
            url: '/user/profile?user=johndoe&key=abc123',
            data: {},
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
              authorization: 'BEARER token55',
              'content-type': 'application/json'
            }
          },
          expires: 0,
          dependencies: []
        }
      },
      statusCode: 201
    },
    registerSuccessfulMockPOSTRequest: {
      json: {
        path: '/api/mock',
        method: 'POST',
        json: {
          request: {
            method: 'POST',
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
              authorization: 'BEARER token55',
              'content-type': 'application/json'
            }
          },
          expires: 0,
          dependencies: []
        }
      },
      statusCode: 201
    },
    registerRequestForExpireFunctionality: {
      json: {
        path: '/api/mock',
        method: 'POST',
        json: {
          request: {
            method: 'POST',
            url: '/user/profile',
            data: {
              user: 'janedoe',
              key: 'abc123'
            },
            headers: {
              authorization: 'BEARER token55'
            }
          },
          response: {
            statusCode: 200,
            data: {
              firstName: 'Jane',
              lastName: 'Doe',
              dob: '1981-09-13',
              city: 'Orlando',
              state: 'FL'
            },
            headers: {
              authorization: 'BEARER token55',
              'content-type': 'application/json'
            }
          },
          expires: 0,
          dependencies: []
        }
      },
      statusCode: 201
    },
    registerRequestWithDynamicResponse: {
      json: {
        path: '/api/mock',
        method: 'POST',
        json: {
          request: {
            method: 'POST',
            url: '/system/status',
            data: {
              type: 'thorough'
            },
            headers: {
              authorization: 'BEARER token55'
            }
          },
          response: {
            statusCode: 200,
            data: {}, // To be filled out by test
            headers: {
              authorization: 'BEARER token55',
              'content-type': 'application/json'
            }
          },
          expires: 0,
          dependencies: []
        }
      },
      statusCode: 201
    },
    registerRequestForMockState: {
      json: {
        path: '/api/mock',
        method: 'POST',
        json: {
          request: {
            method: 'POST',
            url: '/user/profile',
            data: {
              user: 'janedoe',
              key: 'abc123'
            },
            headers: {
              authorization: 'BEARER token55'
            }
          },
          response: {
            statusCode: 200,
            data: {
              firstName: 'Jane',
              lastName: 'Doe',
              dob: '1981-09-13',
              city: 'Orlando',
              state: 'FL'
            },
            headers: {
              authorization: 'BEARER token55',
              'content-type': 'application/json'
            }
          },
          expires: 0,
          dependencies: []
        }
      },
      statusCode: 201
    },
    registerRequestWithDependencies: {
      json: {
        path: '/api/mock',
        method: 'POST',
        json: {
          request: {
            method: 'GET',
            url: '/api/alert/',
            data: {},
            headers: {
              authorization: 'BEARER token55'
            }
          },
          response: {
            statusCode: 200,
            data: {
              statusCode: 'OK'
            },
            headers: {
              authorization: 'BEARER token55',
              'content-type': 'application/json'
            }
          },
          expires: 0,
          dependencies: [
            {
              method: 'PUT',
              url: '/api/filesystem/',
              data: { id: 1 },
              headers: {
                authorization: 'BEARER token55'
              }
            }
          ]
        }
      }
    }
  }
};
deepFreeze(fixtures);

export default fixtures;

/**
 * Freezes an object and it's properties
 * recursively.
 * @param {Object|Array} obj
 */
function deepFreeze(obj) {
  Object.freeze(obj);

  Object.keys(obj)
    .filter(key => typeof obj[key] === 'object')
    .forEach(function freezeProps(key) {
      deepFreeze(obj[key]);
    });
}
