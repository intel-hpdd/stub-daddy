//
// Copyright (c) 2018 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import { join } from 'path';
import nconf from 'nconf';

const conf = new nconf.Provider()
  .overrides()
  .argv()
  .env()
  .file(join(__dirname, '/conf.json'));

export default conf;
