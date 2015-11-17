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

'use strict';

var format = require('util').format;
var mockStatus = require('../lib/mock-status');
var fp = require('intel-fp/dist/fp');

module.exports = function handleError (req, res, data, next) {
  var stringify = fp.curry(3, JSON.stringify)(fp.__, null, 2);

  if (data.statusCode === 404)
    throw new Error(format('Entry not found. Mock state is: %s',
      stringify(mockStatus.getMockApiState())));
  else if (data.statusCode >= 400)
    throw new Error(format('There was an error with the request. The response is: %s and the mock state is %s',
      stringify(data), stringify(mockStatus.getMockApiState())));

  next(req, res, data);
};
