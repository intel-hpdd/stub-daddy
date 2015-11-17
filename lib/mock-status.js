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

'use strict';

var requestMatcher = require('../matcher');
var logger = require('../logger');
var fp = require('intel-fp/dist/fp');
var obj = require('intel-obj');
var entry = require('./entry');
var entries = require('./entries');
var picker = require('./picker');
var deepEq = require('deep-equal');

var dataLens = fp.lensProp('data');
var qsLens = fp.lensProp('qs');
var requests = [];
var nonMatchingRequests = [];

function recordRequest(request) {
  // Locate the request in the requests dictionary.
  var locatedRequest = fp.filter(requestMatcher(request), requests)
    .shift();

  // Only add the request if it isn't already in the requests list.
  if (!locatedRequest) {
    logger.trace({
      request: request
    }, 'recording request to list of requests made');
    requests.push(request);
  }
}

var generateErrorMessagesForArray = fp.curry(2, function generateErrorMessagesForArray(message, item) {
  return {
    state: 'ERROR',
    message: message,
    data: item
  };
});

function getMockApiState() {
  var unsatisfiedEntries = getUnsatisfiedEntries(entries);
  var state = nonMatchingRequests
    .map(generateErrorMessagesForArray('Call made to non-existent mock'))
    .concat(unsatisfiedEntries.map(generateErrorMessagesForArray('Call to expected mock not satisfied.'))
  );

  logger.trace({
    state: state
  }, 'mock API state');

  if (state.length === 0)
    logger.trace('mock API state is passing');
  else
    logger.trace('mock API state contains ' + state.length + ' errors');

  return state;
}

var getUnsatisfiedEntries = fp.filter(fp.flow(entry.isExpectedCallCount, fp.not));

function haveRequestsBeenSatisfied(requests) {
  if (requests.length === 0)
    return true;

  function matchRequest(req1, req2) {
    return req1.url === req2.url &&
      req1.method === req2.method &&
      deepEq(dataLens(req1), dataLens(req2)) &&
      deepEq(qsLens(req1), qsLens(req2)) &&
      compareHeaders(req1, req2);
  }

  function matchResponse(resp1, resp2) {
    if (resp2 == null)
      return true;

    return resp1.statusCode === resp2.statusCode &&
      deepEq(dataLens(resp1), dataLens(resp2)) &&
      compareHeaders(resp1, resp2);
  }

  function compareHeaders(obj1, obj2) {
    var keys = Object.keys(obj1.headers);
    return deepEq(obj.pickBy(picker(keys), obj1.headers), obj.pickBy(picker(keys), obj2.headers));
  }

  function getMatchingEntries (entries) {
    var requestLens = fp.lensProp('request');
    var responseLens = fp.lensProp('response');
    var invoker = function invoker(a, b) {
      return a(b);
    };

    var permutatedRequests = fp.xProd(entries, requests);
    var requestLensOrIdentity = fp.cond([fp.flow(requestLens, fp.eq(undefined), fp.not), requestLens],
      [fp.True, fp.identity]);
    var mappedRequests = fp.map(fp.zipBy(invoker, [requestLens, requestLensOrIdentity]), permutatedRequests);
    var mappedResponses = fp.map(fp.zipBy(invoker, [responseLens, responseLens]), permutatedRequests);

    var matchingRequests = fp.map(fp.mapFn([matchRequest]), mappedRequests);
    var matchingResponses = fp.map(fp.mapFn([matchResponse]), mappedResponses);

    var matches = fp.zipBy(
      fp.wrapArgs(fp.flow(fp.map(fp.head), fp.every(fp.eq(true)))), matchingRequests, matchingResponses);

    var results = fp.zipBy(
      fp.wrapArgs(fp.flow(fp.cond([fp.flow(fp.tail, fp.eq(true)), fp.flow(fp.head, fp.head)]))),
      permutatedRequests, matches);
    results = fp.filter(fp.flow(fp.eq(undefined), fp.not), results);

    return results;
  }

  var filteredEntries = getMatchingEntries(entries);
  if (filteredEntries.length !== requests.length)
    return false;

  return fp.every(fp.flow(fp.arrayWrap, fp.invoke(entry.isExpectedCallCount)), filteredEntries);
}

function flushRequests() {
  requests.length = 0;
}

module.exports = {
  requests: requests,
  recordRequest: recordRequest,
  recordNonMatchingRequest: [].push.bind(nonMatchingRequests),
  getMockApiState: getMockApiState,
  getUnsatisfiedEntries: getUnsatisfiedEntries,
  haveRequestsBeenSatisfied: haveRequestsBeenSatisfied,
  flushRequests: flushRequests
};
