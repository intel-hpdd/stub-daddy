// @flow

//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

export default s$ => {
  return new Promise((resolve, reject) => {
    s$.errors(reject).each(resolve);
  });
};
