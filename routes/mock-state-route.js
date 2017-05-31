//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import mockState from '../lib/mock-state';

export default (router, entries, mockStatus) => {
  router.route('/api/mockstate').get((req, res, data, next) => {
    next(req, res, mockState(entries, mockStatus));
  });
};
