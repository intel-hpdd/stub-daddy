//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

export default (req, res, data, next) => {
  if (!data) return next(req, res, {});

  if (typeof data === 'string') data = JSON.parse(data);

  next(req, res, data);
};
