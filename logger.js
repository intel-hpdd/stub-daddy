//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import * as fp from '@mfl/fp';

import bunyan from 'bunyan';
import path from 'path';
import config from './config';
const logPath = config.get('logger').logPath;
const level = config.get('logger').level;

const streams = {
  stdout: {
    type: 'stream',
    level: level,
    stream: process.stdout
  },
  file: {
    type: 'file',
    level: level,
    path: path.join(logPath, config.get('logName') + '.log')
  }
};

const envStreams = fp.map(x => streams[x])(config.get('logger').streams);

const logger = bunyan.createLogger({
  name: config.get('logName'),
  serializers: {
    err: bunyan.stdSerializers.err
  },
  streams: envStreams
});

const extendedLogger = Object.create(logger);

extendedLogger.logByLevel = data => {
  if (typeof data !== 'object' || Object.keys(data).length === 0)
    throw new Error(
      'A log level and corresponding message must be passed to logByLevel'
    );
  const levels = Object.keys(data);
  const lowestLevel = logger.level();

  // Take the lowest level specified in the data
  const levelToLog = levels
    .map(key => bunyan.resolveLevel(key))
    .filter(level => level >= lowestLevel)
    .sort((a, b) => a - b)[0];

  // If no levelToLog has been set then there is no reason to log. This can occur if the only log levels
  // passed into data are levels that are below lowest level.
  if (!levelToLog) return;

  const levelKey = bunyan.nameFromLevel[levelToLog];
  logger[levelKey].apply(logger, data[levelKey.toUpperCase()]);
};

export default extendedLogger;
