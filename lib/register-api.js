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
var entry = require('./entry');
var config = require('../config');
var logger = require('../logger');
var entries = require('./entries');
var parseUrl = require('url').parse;

module.exports = function execute(body) {
  var registerResponse = {
    headers: config.get('standardHeaders')
  };

  var newRequest = {
    method: body.request.method,
    url: body.request.url,
    data: body.request.data,
    qs: entry.parsedQueryData(parseUrl(body.request.url)),
    headers: body.request.headers
  };

  var newResponse = {
    statusCode: body.response.statusCode,
    data: body.response.data,
    headers: body.response.headers
  };

  var dependencies = fp.map(function mapDependencies(dependency) {
    var request = dependency.request || dependency;
    var response = dependency.response;

    // The request should always be passed in.
    request = {
      method: request.method,
      url: request.url.replace(/\/*$/, ''),
      data: request.data,
      qs: entry.parsedQueryData(parseUrl(request.url)),
      headers: request.headers
    };

    // The response may or may not have been passed in.
    if (response)
      response = {
        statusCode: response.statusCode,
        data: response.data,
        headers: response.headers
      };

    return {
      request: request,
      response: response
    };
  }, body.dependencies);

  logger.trace('registering request');

  entry.addEntry(newRequest, newResponse, body.expires, dependencies, body.timeout, entries);
  registerResponse.statusCode = config.get('status').CREATED;

  return registerResponse;
};
