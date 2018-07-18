//
// Copyright (c) 2017 DDN. All rights reserved.
// Use of this source code is governed by a MIT-style
// license that can be found in the LICENSE file.

import config from '../config';

export default (entries, mockStatus) => {
  const data = mockStatus.getMockApiState(entries);

  if (data.length > 0)
    throw new Error(
      `Mock state is not satisfied. \n${JSON.stringify(data, null, 2)}`
    );

  return {
    statusCode: config.get('status').SUCCESS,
    data: data,
    headers: config.get('standardHeaders')
  };
};
