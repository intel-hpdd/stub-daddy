//
// Copyright (c) 2017 Intel Corporation. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import * as fp from '@mfl/fp';

import entry from './entry';
import config from '../config';
import logger from '../logger';
import { parse as parseUrl } from 'url';

export default (body, entries) => {
  const registerResponse = {
    headers: config.get('standardHeaders')
  };

  const newRequest = {
    method: body.request.method,
    url: body.request.url,
    data: body.request.data,
    qs: entry.parsedQueryData(parseUrl(body.request.url)),
    headers: body.request.headers
  };

  const newResponse = {
    statusCode: body.response.statusCode,
    data: body.response.data,
    headers: body.response.headers
  };

  const dependencies = fp.map(dependency => {
    let request = dependency.request || dependency;
    let response = dependency.response;

    // The request should always be passed in.
    request = {
      method: request.method,
      url: request.url.replace(/\/*$/, ''),
      data: request.data,
      qs: entry.parsedQueryData(parseUrl(request.url)),
      headers: request.headers
    };

    // The response may or may not have been passed in.
    if (response)
      response = {
        statusCode: response.statusCode,
        data: response.data,
        headers: response.headers
      };

    return {
      request,
      response
    };
  })(body.dependencies);

  logger.trace('registering request');

  entry.addEntry(
    newRequest,
    newResponse,
    body.expires,
    dependencies,
    body.timeout,
    entries
  );
  registerResponse.statusCode = config.get('status').CREATED;

  return registerResponse;
};
