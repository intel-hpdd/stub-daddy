//
// Copyright (c) 2017 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import { join } from 'path';

import dispatch from './lib/dispatch';
import * as url from 'url';
import logger from './logger';
import fs from 'fs';
import { format } from 'util';
import http from 'http';
import https from 'https';
import entry from './lib/entry';
import { clearTimeouts } from './middleware/after-timeout';

const filePath = join.bind(null, __dirname);
const keyPem = fs.readFileSync(filePath('key.pem'), 'utf8');
const certPem = fs.readFileSync(filePath('cert.pem'), 'utf8');

export default (config, router, entries, mockStatus) => {
  let server;
  let sockets = [];

  const dispatcher = dispatch(router);
  function handleSocketConnection(socket) {
    sockets.push(socket);
    socket.on('close', () => sockets.splice(sockets.indexOf(socket), 1));
  }

  function onRequestReceived(req, res) {
    req.url = req.url.replace(/\/*$/, '');
    req.parsedUrl = url.parse(req.url);

    dispatcher(req.url, req.method, req, res);
  }

  function flushEntries(entries) {
    entry.flushEntries(entries);
    mockStatus.flushRequests();
  }

  function executeService(boundCreateServer, port, protocol) {
    server = boundCreateServer(onRequestReceived).listen(port);
    server.on('connection', handleSocketConnection);
    server.on('clientError', err => {
      logger.error(
        {
          err: err
        },
        'Received client error event'
      );
    });
    logger.info(`Starting service on ${protocol}://localhost:${port}`);

    return server;
  }

  return {
    startService() {
      sockets = [];

      if (config.get('requestProtocol') === 'https')
        server = executeService(
          https.createServer.bind(https, {
            key: keyPem,
            cert: certPem
          }),
          config.get('port'),
          config.get('requestProtocol')
        );
      else
        server = executeService(
          http.createServer.bind(http),
          config.get('port'),
          config.get('requestProtocol')
        );

      return server;
    },

    stopService(onError, done) {
      logger.info('Service stopping...');

      if (sockets.length > 0)
        logger.trace(
          format('Destroying %s remaining socket connections.', sockets.length)
        );

      // Clear out any timeouts in the middleware that might be waiting.
      clearTimeouts();

      // Make sure all sockets have been closed
      while (sockets.length > 0) {
        const socket = sockets.shift();
        socket.server = server;
        socket.destroy();
      }

      flushEntries(entries);

      server.once('close', err => {
        if (err) onError(err);

        done();
      });

      server.close();
    },

    getConnectionCount: () => sockets.length
  };
};
