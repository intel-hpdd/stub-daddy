//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import logger from '../logger';

export default (req, res, next) => {
  if (!req.clientReq.on) return next(req, res, req.clientReq.data);

  let data;
  req.clientReq.on('data', chunk => {
    if (chunk) {
      data = data || '';
      data += chunk.toString('utf8');
    }
  });

  req.clientReq.on('end', () => {
    logger.logByLevel({
      DEBUG: [req.clientReq.parsedUrl.pathname, 'Request received:'],
      TRACE: [
        {
          pathname: req.clientReq.parsedUrl.pathname,
          body: data ? data : undefined
        },
        'Request received'
      ]
    });

    next(req, res, data);
  });
};
