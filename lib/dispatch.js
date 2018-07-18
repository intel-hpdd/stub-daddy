//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

export default router => (url, verb, clientReq, clientRes) => {
  let outgoing = {};

  router.go(
    url,
    {
      verb: verb,
      clientReq: clientReq
    },
    {
      clientRes: clientRes
    },
    function cb(req, res, data) {
      outgoing = Object.assign(outgoing, data);
    }
  );

  return outgoing;
};
