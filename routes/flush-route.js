//
// Copyright (c) 2017 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import flushState from '../lib/flush-state';

export default (router, entries, mockStatus) => {
  router
    .route('/api/flush')
    .delete((req, res, data, next) =>
      next(req, res, flushState(entries, mockStatus))
    );
};
