//
// INTEL CONFIDENTIAL
//
// Copyright 2013-2016 Intel Corporation All Rights Reserved.
//
// The source code contained or described herein and all documents related
// to the source code ("Material") are owned by Intel Corporation or its
// suppliers or licensors. Title to the Material remains with Intel Corporation
// or its suppliers and licensors. The Material contains trade secrets and
// proprietary and confidential information of Intel or its suppliers and
// licensors. The Material is protected by worldwide copyright and trade secret
// laws and treaty provisions. No part of the Material may be used, copied,
// reproduced, modified, published, uploaded, posted, transmitted, distributed,
// or disclosed in any way without Intel's prior express written permission.
//
// No license under any patent, copyright, trade secret or other intellectual
// property right is granted to or conferred upon you by disclosure or delivery
// of the Materials, either expressly, by implication, inducement, estoppel or
// otherwise. Any license under such intellectual property rights must be
// express and approved by Intel in writing.

import { join } from 'path';

import dispatch from './lib/dispatch';
import mockStatus from './lib/mock-status';
import config from './config';
import url from 'url';
import logger from './logger';
import fs from 'fs';
import { format } from 'util';
import http from 'http';
import https from 'https';
import entry from './lib/entry';
import entries from './lib/entries';
import { clearTimeouts } from './middleware/after-timeout';

const filePath = join.bind(null, __dirname);
const keyPem = fs.readFileSync(filePath('key.pem'), 'utf8');
const certPem = fs.readFileSync(filePath('cert.pem'), 'utf8');

let server;
let sockets = [];

function handleSocketConnection(socket) {
  sockets.push(socket);
  socket.on('close', function() {
    return sockets.splice(sockets.indexOf(socket), 1);
  });
}

function onRequestReceived(req, res) {
  req.url = req.url.replace(/\/*$/, '');
  req.parsedUrl = url.parse(req.url);

  dispatch(req.url, req.method, req, res);
}

function flushEntries() {
  entry.flushEntries(entries);
  mockStatus.flushRequests();
}

function executeService(boundCreateServer, port) {
  server = boundCreateServer(onRequestReceived).listen(port);
  server.on('connection', handleSocketConnection);
  server.on('clientError', function onClientError(err) {
    logger.error(
      {
        err: err
      },
      'Received client error event'
    );
  });
  logger.info(
    format(
      'Starting service on %s://localhost:%s',
      config.get('requestProtocol'),
      port
    )
  );

  return server;
}

export default {
  startService: function startService() {
    sockets = [];

    if (config.get('requestProtocol') === 'https')
      server = executeService(
        https.createServer.bind(https, {
          key: keyPem,
          cert: certPem
        }),
        config.get('port')
      );
    else
      server = executeService(http.createServer.bind(http), config.get('port'));

    return server;
  },

  stopService: function stopService(onError, done) {
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

    flushEntries();

    server.close();
    server.on('close', function(err) {
      if (err) onError(err);

      done();
    });
  },

  getConnectionCount: function getConnectionCount() {
    return sockets.length;
  }
};
