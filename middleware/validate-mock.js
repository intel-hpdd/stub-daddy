//
// Copyright (c) 2017 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import registerApiValidator from '../validators/register-api-validator';

export default (req, res, body, next) => {
  const validationErrors = registerApiValidator(body).errors;
  if (validationErrors.length > 0)
    throw new Error(
      `Validation of mock failed: ${JSON.stringify(validationErrors, null, 2)}`
    );

  return next(req, res, body);
};
