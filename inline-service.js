//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import entry from './lib/entry';
import { parse as parseUrl } from 'url';
import dispatch from './lib/dispatch';

export default (config, router, entries, mockStatus) => {
  const dispatcher = dispatch(router);

  return {
    mock: mock => {
      const url = config.get('requestUrls').MOCK_REQUEST;

      return dispatcher(
        url,
        'POST',
        {
          data: mock,
          parsedUrl: parseUrl(url)
        },
        {}
      );
    },
    mockState: () => {
      const url = config.get('requestUrls').MOCK_STATE;

      return dispatcher(
        url,
        'GET',
        {
          parsedUrl: parseUrl(url)
        },
        {}
      );
    },
    registeredMocks: () => {
      const url = config.get('requestUrls').MOCK_LIST;

      return dispatcher(
        url,
        'GET',
        {
          parsedUrl: parseUrl(url)
        },
        {}
      );
    },
    makeRequest: options => {
      options.parsedUrl = parseUrl(options.url);
      return dispatcher(options.url, options.method || 'GET', options, {});
    },
    flush: () => {
      entry.flushEntries(entries);
      mockStatus.flushRequests();
    }
  };
};
