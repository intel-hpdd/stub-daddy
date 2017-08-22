//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import requestValidator from '../validators/request-validator';

export default (req, res, body, next) => {
  const validationErrors = requestValidator(req.clientReq).errors;
  if (validationErrors.length > 0)
    throw new Error(
      `Validation of request failed: ${JSON.stringify(
        validationErrors,
        null,
        2
      )}`
    );

  return next(req, res, body);
};
