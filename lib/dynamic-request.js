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

var mockStatus = require('./mock-status');
var entry = require('./entry');
var logger = require('../logger');
var fp = require('@mfl/fp');
var entries = require('./entries');

module.exports = function process(request, body) {
  body = body || {};
  var qs = entry.parsedQueryData(request.parsedUrl);

  var searchRequest = {
    method: request.method,
    url: request.url,
    data: body,
    qs: qs,
    headers: request.headers
  };

  logger.trace({
    searchRequest: searchRequest
  }, 'new search request instance created');

  // record the request in the mock state module.
  mockStatus.recordRequest(searchRequest);
  var matchingEntries = entry.findEntriesByRequest(mockStatus, searchRequest, entries);

  var selectedEntry;
  if (matchingEntries == null) {
    mockStatus.recordNonMatchingRequest(searchRequest);
  } else {
    selectedEntry = matchingEntries[0];

    logger.trace({
      entry: selectedEntry
    }, 'entry from request store matching the request');

    entry.updateCallCount(selectedEntry);
    entry.updateEntry(selectedEntry, entries);
  }

  return selectedEntry;
};
