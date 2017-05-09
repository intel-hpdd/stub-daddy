//
// INTEL CONFIDENTIAL
//
// Copyright 2013-2017 Intel Corporation All Rights Reserved.
//
// The source code contained or described herein and all documents related
// to the source code ("Material") are owned by Intel Corporation or its
// suppliers or licensors. Title to the Material remains with Intel Corporation
// or its suppliers and licensors. The Material contains trade secrets and
// proprietary and confidential information of Intel or its suppliers and
// licensors. The Material is protected by worldwide copyright and trade secret
// laws and treaty provisions. No part of the Material may be used, copied,
// reproduced, modified, published, uploaded, posted, transmitted, distributed,
// or disclosed in any way without Intel's prior express written permission.
//
// No license under any patent, copyright, trade secret or other intellectual
// property right is granted to or conferred upon you by disclosure or delivery
// of the Materials, either expressly, by implication, inducement, estoppel or
// otherwise. Any license under such intellectual property rights must be
// express and approved by Intel in writing.

import { Validator } from 'jsonschema';

// request schema
const requestSchema = {
  id: '/RegisterRequest',
  type: 'object',
  required: true,
  properties: {
    method: { type: 'string', required: true },
    url: { type: 'string', required: true },
    data: { type: 'object', required: true },
    headers: { type: 'object', required: true }
  }
};

// response schema
const responseSchema = {
  id: '/RegisterResponse',
  type: 'object',
  required: true,
  properties: {
    statusCode: { type: 'integer', required: true },
    data: { type: 'object', required: true },
    headers: { type: 'object', required: true }
  }
};

// Optional Dependencies
const dependenciesSchema = {
  id: '/RegisterDependencies',
  type: 'array',
  required: true
};

// body schema
const bodySchema = {
  id: '/RegisterApi',
  type: 'object',
  required: true,
  properties: {
    request: { $ref: '/RegisterRequest' },
    response: { $ref: '/RegisterResponse' },
    dependencies: { $ref: '/RegisterDependencies' },
    expires: { type: 'integer', minimum: -1, required: true }
  }
};

export default function validate(body) {
  const v = new Validator();

  // json schema doesn't handle a null body but it will handle undefined. Cast this to
  // undefined in either case.
  if (body == null) body = undefined;

  v.addSchema(requestSchema, '/RegisterRequest');
  v.addSchema(responseSchema, '/RegisterResponse');
  v.addSchema(dependenciesSchema, '/RegisterDependencies');
  return v.validate(body, bodySchema);
}
