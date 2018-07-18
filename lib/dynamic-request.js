//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

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
