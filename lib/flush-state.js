//
// Copyright (c) 2017 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import entry from './entry';
import config from '../config';

export default (entries, mockStatus) => {
  // Flush all entries
  entry.flushEntries(entries);
  mockStatus.flushRequests();

  return {
    statusCode: config.get('status').SUCCESS,
    headers: config.get('standardHeaders')
  };
};
