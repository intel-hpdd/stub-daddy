//
// Copyright (c) 2017 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

let timeouts = [];

export default function afterTimeout(req, res, body, next) {
  if (req.timeout) {
    const id = setTimeout(() => {
      timeouts.splice(timeouts.indexOf(id), 1);
      next(req, res, body);
    }, req.timeout);

    timeouts.push(id);
  } else {
    next(req, res, body);
  }
}

export const clearTimeouts = function clearTimeouts() {
  timeouts.forEach(clearTimeout);
  timeouts = [];
};
