//
// Copyright (c) 2017 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import nconf from './config';
import * as routes from './routes';
import routerFactory from './router.js';
import mockStatusFactory from './lib/mock-status.js';

export default function stubDaddyFactory(overrides) {
  const entries = [];
  const mockStatus = mockStatusFactory();
  const config = nconf.overrides(overrides);
  const router = routerFactory();

  Object.keys(routes)
    .filter(x => x !== 'default')
    .map(x => routes[x](router, entries, mockStatus));

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
