//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import getRouter from '@iml/router';
import * as middleware from './middleware';

export default () =>
  getRouter()
    .addStart(middleware.processData)
    .addStart(middleware.toJson)
    .addEnd(middleware.writeResponse);
