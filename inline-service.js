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

const config = require('./config');
const logger = require('./logger');
const mockStatus = require('./lib/mock-status');
const format = require('util').format;
const fp = require('@mfl/fp');
const entries = require('./lib/entries');
const entry = require('./lib/entry');
const parseUrl = require('url').parse;
const dispatch = require('./lib/dispatch');

const stringifyObj = fp.curry(3, JSON.stringify)(fp.__, null, 2);

function handleError(item, type, errors) {
  const message = format(
    'The %s is invalid: \n\n %s \n\n Reasons: \n\n %s',
    type,
    stringifyObj(item),
    stringifyObj(errors)
  );

  throw new Error(message);
}

function mock(mock) {
  const url = config.get('requestUrls').MOCK_REQUEST;
  return dispatch(
    url,
    'POST',
    {
      data: mock,
      parsedUrl: parseUrl(url)
    },
    {}
  );
}

function mockState() {
  const url = config.get('requestUrls').MOCK_STATE;

  return dispatch(
    url,
    'GET',
    {
      parsedUrl: parseUrl(url)
    },
    {}
  );
}

function registeredMocks() {
  const url = config.get('requestUrls').MOCK_LIST;

  return dispatch(
    url,
    'GET',
    {
      parsedUrl: parseUrl(url)
    },
    {}
  );
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
