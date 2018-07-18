//
// Copyright (c) 2017 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

export default (req, res, data, next) => {
  if (!res.clientRes.writeHead) return next(req, res, data);

  res.clientRes.writeHead(data.statusCode, data.headers);

  data.data = data.data || {};
  res.clientRes.write(JSON.stringify(data.data));

  res.clientRes.end();

  next(req, res, data);
};
