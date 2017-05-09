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
