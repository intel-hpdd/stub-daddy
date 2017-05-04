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

const querystring = require('querystring');
const url = require('url');
const config = require('../config');
const logger = require('../logger');
const fp = require('@mfl/fp');
const requestMatcher = require('../matcher');
const deepEq = fp.curry(2, require('deep-equal'));

function canMakeRequest(entry) {
  return entry.remainingCalls > 0 || entry.expires <= 0;
}

function isExpectedCallCount(entry) {
  if (entry.expires > 0) return entry.remainingCalls === 0;
  if (entry.expires === 0)
    return entry.calls > 0; // must be called at least once
  else return true;
}

function parsedQueryData(parsedUrl) {
  return querystring.parse(parsedUrl.query);
}

function updateCallCount(entry) {
  if (entry.expires > 0) entry.remainingCalls -= 1;
  else if (entry.expires <= 0) entry.remainingCalls = 1;

  entry.calls += 1;
}

function addEntry(request, response, expires, dependencies, timeout, entries) {
  request.url = request.url.replace(/\/*$/, '');

  logger.logByLevel({
    DEBUG: [{ url: request.url }, 'adding entry to request store.'],
    TRACE: [
      {
        request: request,
        response: response,
        expires: expires,
        dependencies: dependencies
      },
      'adding entry to request store: '
    ]
  });

  entries.push({
    request: request,
    response: response,
    expires: expires,
    dependencies: dependencies,
    timeout: timeout || 0,
    remainingCalls: expires > 0 ? expires : 1,
    calls: 0
  });
}

function findEntriesByRequest(mockStatus, request, entries) {
  const filteredEntries = fp.filter(function filterEntries(element) {
    return requestMatcher(request, element.request);
  }, entries);

  if (filteredEntries.length > 0) {
    const requestDataLens = fp.pathLens(['request', 'data']);
    const dataLens = fp.lensProp('data');
    const dataEqual = fp.flow(requestDataLens, deepEq(dataLens(request)));

    // Multiple matches may have been found, some potentially with exact matches to the request and some that
    // don't. Filter these such that if there are any exact matches they will be extracted.
    let selectedEntries = fp.filter(dataEqual, filteredEntries);

    const requestQueryLens = fp.pathLens(['request', 'qs']);
    const qsLens = fp.lensProp('qs');
    const qsEqual = fp.flow(requestQueryLens, deepEq(qsLens(request)));

    selectedEntries = fp.filter(qsEqual, selectedEntries);

    if (!selectedEntries.length) selectedEntries = filteredEntries;

    const haveRequestsBeenSatisfied = mockStatus.haveRequestsBeenSatisfied.bind(
      null
    );
    selectedEntries = fp.filter(
      fp.flow(
        fp.lensProp('dependencies'),
        fp.arrayWrap,
        fp.invoke(haveRequestsBeenSatisfied)
      ),
      selectedEntries
    );

    if (selectedEntries.length === 0) return null;

    logger.logByLevel({
      DEBUG: ['found entry by request', request.url],
      TRACE: [
        {
          request: request,
          entries: selectedEntries
        },
        'found entry by request'
      ]
    });

    return selectedEntries;
  } else {
    logger.warn({ request: request }, 'entry for request not found');
    return null;
  }
}

function updateEntry(selectedEntry, entries) {
  const updatedEntries = fp.map(function updateEntryDependencies(currentEntry) {
    const matchingIndices = currentEntry.dependencies
      .map(function checkDependency(dependency, index) {
        if (
          requestMatcher(
            selectedEntry.request,
            dependency.request || dependency
          )
        )
          return index;
      })
      .filter(fp.flow(fp.eq(undefined), fp.not));

    if (matchingIndices.length > 0)
      currentEntry.dependencies.splice(matchingIndices[0], 1);

    return currentEntry;
  }, entries);

  if (!canMakeRequest(selectedEntry))
    updatedEntries.splice(entries.indexOf(selectedEntry), 1);

  entries.length = 0;
  [].push.apply(entries, updatedEntries);
}

function flushEntries(entries) {
  logger.info('flushing request store entries');

  // reset the entries array.
  entries.length = 0;
}

module.exports = {
  canMakeRequest: canMakeRequest,
  isExpectedCallCount: isExpectedCallCount,
  parsedQueryData: parsedQueryData,
  updateCallCount: updateCallCount,
  addEntry: addEntry,
  findEntriesByRequest: findEntriesByRequest,
  updateEntry: updateEntry,
  flushEntries: flushEntries
};
