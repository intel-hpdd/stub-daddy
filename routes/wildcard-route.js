//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import dynamicRequest from '../lib/dynamic-request';
import afterTimeout from '../middleware/after-timeout';
import validateRequest from '../middleware/validate-request';
import logger from '../logger';

export default function wildcardRoute(router, entries, mockStatus) {
  router
    .route('(.*)')
    .all(validateRequest)
    .all(processRequest)
    .all(afterTimeout);

  function processRequest(req, res, data, next) {
    logger.debug(
      { headers: req.clientReq.headers, data },
      'processing request for wildcard'
    );
    const entry = dynamicRequest(req.clientReq, data, entries, mockStatus);

    if (!entry) {
      const status = JSON.stringify(
        mockStatus.getMockApiState(entries),
        null,
        2
      );

      throw new Error(`Entry not found. Mock state is: ${status}`);
    }

    req.timeout = entry.timeout;

    next(req, res, entry.response);
  }
}
