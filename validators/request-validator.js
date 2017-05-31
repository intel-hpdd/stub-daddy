//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import { Validator } from 'jsonschema';

const schema = {
  id: '/schema',
  type: 'object',
  required: true,
  properties: {
    url: { type: 'string', minimum: 0, required: true },
    method: { type: 'string', minimum: 0, required: true },
    data: { type: 'object' },
    headers: { type: 'object', required: true }
  }
};

export default function validate(body) {
  const v = new Validator();

  body = body ? body : undefined;

  return v.validate(body, schema);
}
