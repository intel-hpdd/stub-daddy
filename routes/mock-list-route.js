//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import mockList from '../lib/mock-list';

export default (router, entries) => {
  router.route('/api/mocklist').get((req, res, data, next) => {
    next(req, res, mockList(entries));
  });
};
