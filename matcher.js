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

var url = require('url');
var fp = require('@mfl/fp');
var obj = require('@mfl/obj');
var picker = require('./lib/picker');
var deepEq = require('deep-equal');

function compare(registeredRequest, incomingRequest, property) {
  var propertyLens = fp.lensProp(property);
  var pickFromObj = obj.pickBy(picker(Object.keys(propertyLens(registeredRequest))));
  var registeredRequestObj = pickFromObj(propertyLens(registeredRequest));
  var incomingRequestObj = pickFromObj(propertyLens(incomingRequest));

  return deepEq(registeredRequestObj, incomingRequestObj);
}

module.exports = fp.curry(2, function match (incomingRequest, registeredRequest) {
  var isMatch = (incomingRequest.method === registeredRequest.method) &&
    (url.parse(incomingRequest.url).pathname === url.parse(registeredRequest.url).pathname);

  // For data, we only care to verify that the data in the registered request exists
  // in the incoming request. It's perfectly fine if the incoming request contains more
  // data than what's in the registered request.
  return isMatch && compare(registeredRequest, incomingRequest, 'data') &&
    compare(registeredRequest, incomingRequest, 'qs') &&
    compare(registeredRequest, incomingRequest, 'headers');
});
