//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import querystring from 'querystring';

import logger from '../logger';
import * as fp from '@iml/fp';
import requestMatcher from '../matcher.js';
import deepEqual from 'deep-equal';

const deepEq = x => y => deepEqual(x, y);

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
    request,
    response,
    expires,
    dependencies,
    timeout: timeout || 0,
    remainingCalls: expires > 0 ? expires : 1,
    calls: 0
  });

  return entries;
}

function findEntriesByRequest(mockStatus, request, entries) {
  const matchByElementRequest = requestMatcher(request);
  const filteredEntries = entries.filter(
    x => x != null && matchByElementRequest(x.request || x)
  );

  if (filteredEntries.length > 0) {
    const dataEqual = fp.flow(
      x => x['request']['data'],
      deepEq(request['data'])
    );

    // Multiple matches may have been found, some potentially with exact matches to the request and some that
    // don't. Filter these such that if there are any exact matches they will be extracted.
    let selectedEntries = fp.filter(dataEqual)(filteredEntries);

    const qsEqual = fp.flow(x => x['request']['qs'], deepEq(request['qs']));

    selectedEntries = fp.filter(qsEqual)(selectedEntries);

    if (!selectedEntries.length) selectedEntries = filteredEntries;

    const haveRequestsBeenSatisfied = x =>
      mockStatus.haveRequestsBeenSatisfied(selectedEntries, x);

    selectedEntries = selectedEntries.filter(x =>
      haveRequestsBeenSatisfied(x['dependencies'])
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
  const updatedEntries = fp.map(currentEntry => {
    const matchingIndices = currentEntry.dependencies
      .map((dependency, index) => {
        if (
          requestMatcher(selectedEntry.request)(
            dependency.request || dependency
          )
        )
          return index;
      })
      .filter(fp.flow(fp.eq(undefined), fp.not));

    if (matchingIndices.length > 0)
      currentEntry.dependencies.splice(matchingIndices[0], 1);

    return currentEntry;
  })(entries);

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

export default {
  canMakeRequest,
  isExpectedCallCount,
  parsedQueryData,
  updateCallCount,
  addEntry,
  findEntriesByRequest,
  updateEntry,
  flushEntries
};
