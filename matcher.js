//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import * as url from 'url';
import * as obj from '@iml/obj';
import picker from './lib/picker';
import deepEq from 'deep-equal';

function compare(registeredRequest, incomingRequest, property) {
  const pickBy = picker(Object.keys(registeredRequest[property]));
  const registeredRequestObj = obj.pickBy(pickBy, registeredRequest[property]);
  const incomingRequestObj = obj.pickBy(pickBy, incomingRequest[property]);

  return deepEq(registeredRequestObj, incomingRequestObj);
}

export default incomingRequest => registeredRequest => {
  const isMatch =
    incomingRequest.method === registeredRequest.method &&
    url.parse(incomingRequest.url).pathname ===
      url.parse(registeredRequest.url).pathname;

  // For data, we only care to verify that the data in the registered request exists
  // in the incoming request. It's perfectly fine if the incoming request contains more
  // data than what's in the registered request.
  return (
    isMatch &&
    compare(registeredRequest, incomingRequest, 'data') &&
    compare(registeredRequest, incomingRequest, 'qs') &&
    compare(registeredRequest, incomingRequest, 'headers')
  );
};
