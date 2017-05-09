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

import nconf from './config';
import routes from './routes';
import routerFactory from './router.js';
import mockStatusFactory from './lib/mock-status.js';
import * as fp from '@mfl/fp';

export default function stubDaddyFactory(overrides) {
  const entries = [];
  const mockStatus = mockStatusFactory();
  const config = nconf.overrides(overrides);
  const router = routerFactory();

  fp.map(x => routes[x].default(router, entries, mockStatus))(
    Object.keys(routes)
  );

  return {
    config,
    webService: require('./web-service').default(
      config,
      router,
      entries,
      mockStatus
    ),
    inlineService: require('./inline-service').default(
      config,
      router,
      entries,
      mockStatus
    ),
    validator: require('./validators/register-api-validator').default
  };
}
