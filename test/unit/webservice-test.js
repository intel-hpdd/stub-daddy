/*jshint node: true*/
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var format = require('util').format;
var fp = require('intel-fp/dist/fp');
var obj = require('intel-obj');

describe('webservice module', function () {
  var webservice, entry, mockStatus, logger, fs, request, dispatch, spy, config, entries, parseUrl, afterTimeout;

  beforeEach(function () {
    spy = jasmine.createSpy('spy');
    config = require('../../config');

    request = {
      createServer: jasmine.createSpy('createServer')
    };

    entry = {
      flushEntries: jasmine.createSpy('flushEntries')
    };

    entries = [];

    mockStatus = {
      flushRequests: jasmine.createSpy('flushRequests')
    };
    logger = {
      info: jasmine.createSpy('info'),
      trace: jasmine.createSpy('trace'),
      logByLevel: jasmine.createSpy('logByLevel'),
      warn: jasmine.createSpy('warn'),
      error: jasmine.createSpy('error')
    };
    fs = {
      readFileSync: jasmine.createSpy('readFileSync')
    };
    dispatch = jasmine.createSpy('dispatch');

    fs.readFileSync.and.callFake(function (filename) {
      if (filename.indexOf('key.pem') > -1)
        return 'key-data';
      else if (filename.indexOf('cert.pem') > -1)
        return 'cert-data';
    });

    afterTimeout = {
      clearTimeouts: jasmine.createSpy('clearTimeouts')
    };

    parseUrl = {
      parse: jasmine.createSpy('parse')
    };

    webservice = proxyquire('../../web-service', {
      './lib/mock-status': mockStatus,
      './logger': logger,
      './lib/dispatch': dispatch,
      'fs': fs,
      'http': request,
      'https': request,
      './lib/entries': entries,
      './lib/entry': entry,
      './middleware/after-timeout': afterTimeout,
      'url': parseUrl
    });
  });

  describe('starting the server', function () {
    var s, server;

    beforeEach(function () {
      server = {
        listen: jasmine.createSpy('listen'),
        on: jasmine.createSpy('on'),
        close: jasmine.createSpy('close')
      };

      server.listen.and.returnValue(server);

      request.createServer.and.returnValue(server);
    });

    describe('in https mode', function () {
      beforeEach(function () {
        config.set('requestProtocol', 'https');
        s = webservice.startService();
      });

      it('should return the server', function () {
        expect(s).toEqual(server);
      });

      it('should invoke createServer with cert and key files', function () {
        expect(request.createServer).toHaveBeenCalledOnceWith({
          key: 'key-data',
          cert: 'cert-data'
        }, jasmine.any(Function));
      });

      it('should listen on the config port', function () {
        expect(server.listen).toHaveBeenCalledOnceWith(config.get('port'));
      });

      it('should listen for connections', function () {
        expect(server.on).toHaveBeenCalledOnceWith('connection', jasmine.any(Function));
      });

      it('should listen for client errors', function () {
        expect(server.on).toHaveBeenCalledOnceWith('clientError', jasmine.any(Function));
      });

      it('should log that the service is starting', function () {
        expect(logger.info).toHaveBeenCalledOnceWith(format('Starting service on %s://localhost:%s',
          config.get('requestProtocol'), config.get('port')));
      });
    });

    describe('in http mode', function () {
      var socket, handleSocketConnection;
      beforeEach(function () {
        config.set('requestProtocol', 'http');

        socket = {
          setTimeout: jasmine.createSpy('setTimeout'),
          on: jasmine.createSpy('on'),
          destroy: jasmine.createSpy('destroy')
        };

        s = webservice.startService();

        handleSocketConnection = server.on.calls.argsFor(0)[1];
        handleSocketConnection(socket);
      });

      it('should return the server', function () {
        expect(s).toEqual(server);
      });

      it('should invoke createServer', function () {
        expect(request.createServer).toHaveBeenCalledOnceWith(jasmine.any(Function));
      });

      it('should listen on the config port', function () {
        expect(server.listen).toHaveBeenCalledOnceWith(config.get('port'));
      });

      it('should listen for connections', function () {
        expect(server.on).toHaveBeenCalledOnceWith('connection', jasmine.any(Function));
      });

      it('should listen for client errors', function () {
        expect(server.on).toHaveBeenCalledOnceWith('clientError', jasmine.any(Function));
      });

      it('should log that the service is starting', function () {
        expect(logger.info).toHaveBeenCalledOnceWith(format('Starting service on %s://localhost:%s',
          config.get('requestProtocol'), config.get('port')));
      });

      it('should have a socket count equal to 1', function () {
        expect(webservice.getConnectionCount()).toEqual(1);
      });

      it('should splice off the socket when it is closed', function () {
        var onClose = socket.on.calls.argsFor(0)[1];
        var socketRemoved = onClose();
        expect(socketRemoved).toEqual([socket]);
      });

      describe('handling a request', function () {
        var onRequestReceived, req, res;

        beforeEach(function () {
          onRequestReceived = request.createServer.calls.argsFor(0)[0];

          req = {
            url: '/api/route',
            method: 'GET'
          };

          res = {
            statusCode: 200
          };

          parseUrl.parse.and.returnValue({path: '/api/route'});
          onRequestReceived(req, res);
        });

        it('should dispatch', function () {
          expect(dispatch).toHaveBeenCalledOnceWith('/api/route', 'GET', {
            url: '/api/route',
            method: 'GET',
            parsedUrl: {path: '/api/route'}
          }, {
            statusCode: 200
          });
        });
      });

      describe('stopping the service', function () {
        var done, fail;
        beforeEach(function () {
          done = jasmine.createSpy('done');
          fail = jasmine.createSpy('fail');

          webservice.stopService(fail, done);
        });

        it('should close the server', function () {
          expect(server.close).toHaveBeenCalledOnce();
        });

        it('should log that the service is stopping', function () {
          expect(logger.info).toHaveBeenCalledOnceWith('Service stopping...');
        });

        it('should log that the socket is being destroyed', function () {
          expect(logger.trace).toHaveBeenCalledOnceWith('Destroying 1 remaining socket connections.');
        });

        it('should set the server on the socket', function () {
          expect(socket.server).toEqual(server);
        });

        it('should destroy the socket', function () {
          expect(socket.destroy).toHaveBeenCalledOnce();
        });

        it('should have 0 sockets', function () {
          expect(webservice.getConnectionCount()).toEqual(0);
        });

        it('should flush the entries in the request store', function () {
          expect(entry.flushEntries).toHaveBeenCalledOnce(entries);
        });

        it('should flush the requests in the mockStatus module', function () {
          expect(mockStatus.flushRequests).toHaveBeenCalledOnce();
        });

        it('should clear out all timeouts', function () {
          expect(afterTimeout.clearTimeouts).toHaveBeenCalledOnce();
        });

        describe('on close event', function () {
          var onClose;
          beforeEach(function () {
            onClose = server.on.calls.argsFor(2)[1];
            onClose();
          });

          it('should not fail', function () {
            expect(fail).not.toHaveBeenCalled();
          });

          it('should call done', function () {
            expect(done).toHaveBeenCalledOnce();
          });
        });
      });
    });
  });

});