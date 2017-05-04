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

const router = require('../router');
const dynamicRequest = require('../lib/dynamic-request');
const config = require('../config');
const afterTimeout = require('../middleware/after-timeout');
const validateRequest = require('../middleware/validate-request');
const mockStatus = require('../lib/mock-status');
const fp = require('@mfl/fp');
const format = require('util').format;

module.exports = function wildcardRoute() {
  router
    .route('(.*)')
    .all(validateRequest)
    .all(processRequest)
    .all(afterTimeout);

  function processRequest(req, res, data, next) {
    const entry = dynamicRequest(req.clientReq, data);

    if (!entry)
      throw new Error(
        format(
          'Entry not found. Mock state is: %s',
          JSON.stringify(mockStatus.getMockApiState(), null, 2)
        )
      );

    req.timeout = entry.timeout;

    next(req, res, entry.response);
  }
};
