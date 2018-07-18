//
// Copyright (c) 2017 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import registerApi from '../lib/register-api';
import validateMock from '../middleware/validate-mock';
import config from '../config';

export default (router, entries) => {
  router.route('/api/mock').post(validateMock).post((req, res, data, next) => {
    let response = {
      statusCode: config.get('status').BAD_REQUEST,
      headers: config.get('standardHeaders')
    };

    if (data != null) response = registerApi(data, entries);

    next(req, res, response);
  });
};
