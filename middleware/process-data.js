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

const logger = require('../logger');

module.exports = function processData(req, res, next) {
  if (!req.clientReq.on) return next(req, res, req.clientReq.data);

  let data;
  req.clientReq.on('data', function handleData(chunk) {
    if (chunk) {
      data = data || '';
      data += chunk.toString('utf8');
    }
  });

  req.clientReq.on('end', function handleEnd() {
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
