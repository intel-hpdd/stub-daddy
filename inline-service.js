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
