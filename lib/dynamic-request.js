//
// INTEL CONFIDENTIAL
//
// Copyright 2013-2017 Intel Corporation All Rights Reserved.
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

import entry from './entry';
import logger from '../logger';

export default (request, body, entries, mockStatus) => {
  body = body || {};
  const qs = entry.parsedQueryData(request.parsedUrl);

  const searchRequest = {
    method: request.method,
    url: request.url,
    data: body,
    qs: qs,
    headers: request.headers
  };

  logger.trace(
    {
      searchRequest: searchRequest
    },
    'new search request instance created'
  );

  // record the request in the mock state module.
  mockStatus.recordRequest(searchRequest);
  const matchingEntries = entry.findEntriesByRequest(
    mockStatus,
    searchRequest,
    entries
  );

  let selectedEntry;
  if (matchingEntries == null) {
    mockStatus.recordNonMatchingRequest(searchRequest);
  } else {
    selectedEntry = matchingEntries[0];

    logger.trace(
      {
        entry: selectedEntry
      },
      'entry from request store matching the request'
    );

    entry.updateCallCount(selectedEntry);
    entry.updateEntry(selectedEntry, entries);
  }

  return selectedEntry;
};
