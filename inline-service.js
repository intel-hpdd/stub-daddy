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

var config = require('./config');
var logger = require('./logger');
var mockStatus = require('./lib/mock-status');
var format = require('util').format;
var fp = require('intel-fp/dist/fp');
var entries = require('./lib/entries');
var entry = require('./lib/entry');
var parseUrl = require('url').parse;
var dispatch = require('./lib/dispatch');

var stringifyObj = fp.curry(3, JSON.stringify)(fp.__, null, 2);

function handleError(item, type, errors) {
  var message = format('The %s is invalid: \n\n %s \n\n Reasons: \n\n %s',
    type,
    stringifyObj(item),
    stringifyObj(errors)
  );

  throw new Error(message);
}

function mock(mock) {
  var url = config.get('requestUrls').MOCK_REQUEST;
  return dispatch(url, 'POST', {
    data: mock,
    parsedUrl: parseUrl(url)
  }, {});
}

function mockState() {
  var url = config.get('requestUrls').MOCK_STATE;

  return dispatch(url, 'GET', {
    parsedUrl: parseUrl(url)
  }, {});
}

function registeredMocks() {
  var url = config.get('requestUrls').MOCK_LIST;

  return dispatch(url, 'GET', {
    parsedUrl: parseUrl(url)
  }, {});
}

function makeRequest(options) {
  options.parsedUrl = parseUrl(options.url);
  return dispatch(options.url, options.method || 'GET', options, {});
}

function flush() {
  entry.flushEntries(entries);
  mockStatus.flushRequests();
}

module.exports = {
  mock: mock,
  mockState: mockState,
  registeredMocks: registeredMocks,
  makeRequest: makeRequest,
  flush: flush
};