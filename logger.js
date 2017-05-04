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

var fp = require('@mfl/fp');
var bunyan = require('bunyan');
var path = require('path');
var config = require('./config');
var logPath = config.get('logger').logPath;
var level = config.get('logger').level;

var streams = {
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

var envStreams = fp.map(fp.flow(fp.lensProp, fp.invoke(fp.__, [streams])), config.get('logger').streams);

var logger = bunyan.createLogger({
  name: config.get('logName'),
  serializers: {
    err: bunyan.stdSerializers.err
  },
  streams: envStreams
});

var extendedLogger = Object.create(logger);

extendedLogger.logByLevel = function logByLevel(data) {
  if (typeof data !== 'object' || Object.keys(data).length === 0)
    throw new Error('A log level and corresponding message must be passed to logByLevel');
  var levels = Object.keys(data);
  var lowestLevel = logger.level();

  // Take the lowest level specified in the data
  var levelToLog = levels.map(function convertKeysToNumericValues(key) {
    return bunyan.resolveLevel(key);
  }).filter(function byLowestLevel(level) {
    return level >= lowestLevel;
  }).sort(function fromLowestToHeighest(a, b) {
    return a - b;
  })[0];

  // If no levelToLog has been set then there is no reason to log. This can occur if the only log levels
  // passed into data are levels that are below lowest level.
  if (!levelToLog)
    return;

  var levelKey = bunyan.nameFromLevel[levelToLog];
  logger[levelKey].apply(logger, data[levelKey.toUpperCase()]);
};

module.exports = extendedLogger;
